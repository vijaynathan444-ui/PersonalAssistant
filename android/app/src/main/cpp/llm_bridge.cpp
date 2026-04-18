#include <jni.h>
#include <android/log.h>
#include <string>
#include <vector>
#include <mutex>
#include <memory>
#include <fstream>
#include <thread>

#include "llama.h"

#define LOG_TAG "LocalAI_LLM"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace {
    struct LLMContext {
        llama_model* model = nullptr;
        llama_context* ctx = nullptr;
        llama_sampler* sampler = nullptr;
        int n_ctx = 2048;
        int n_threads = 4;
        bool loaded = false;
    };

    std::unique_ptr<LLMContext> g_llm;
    std::mutex g_mutex;

    void cleanup_context() {
        if (g_llm) {
            if (g_llm->sampler) {
                llama_sampler_free(g_llm->sampler);
                g_llm->sampler = nullptr;
            }
            if (g_llm->ctx) {
                llama_free(g_llm->ctx);
                g_llm->ctx = nullptr;
            }
            if (g_llm->model) {
                llama_model_free(g_llm->model);
                g_llm->model = nullptr;
            }
            g_llm->loaded = false;
        }
    }
}

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_localaiassistant_llm_LLMBridge_loadModel(
    JNIEnv* env,
    jobject /* this */,
    jstring modelPath,
    jint contextSize,
    jint threads
) {
    std::lock_guard<std::mutex> lock(g_mutex);

    const char* path = env->GetStringUTFChars(modelPath, nullptr);
    if (!path) {
        LOGE("Failed to get model path string");
        return JNI_FALSE;
    }

    LOGI("Loading model from: %s", path);

    // Clean up any existing context
    cleanup_context();

    if (!g_llm) {
        g_llm = std::make_unique<LLMContext>();
    }

    g_llm->n_ctx = contextSize;
    g_llm->n_threads = threads > 0 ? threads : std::max(1, (int)std::thread::hardware_concurrency() - 1);

    // Initialize llama backend
    llama_backend_init();

    // Load model
    llama_model_params model_params = llama_model_default_params();
    model_params.n_gpu_layers = 0; // CPU only for broad compatibility

    g_llm->model = llama_model_load_from_file(path, model_params);
    env->ReleaseStringUTFChars(modelPath, path);

    if (!g_llm->model) {
        LOGE("Failed to load model");
        return JNI_FALSE;
    }

    // Create context
    llama_context_params ctx_params = llama_context_default_params();
    ctx_params.n_ctx = g_llm->n_ctx;
    ctx_params.n_threads = g_llm->n_threads;
    ctx_params.n_threads_batch = g_llm->n_threads;

    g_llm->ctx = llama_init_from_model(g_llm->model, ctx_params);
    if (!g_llm->ctx) {
        LOGE("Failed to create context");
        llama_model_free(g_llm->model);
        g_llm->model = nullptr;
        return JNI_FALSE;
    }

    // Create sampler chain
    llama_sampler_chain_params chain_params = llama_sampler_chain_default_params();
    g_llm->sampler = llama_sampler_chain_init(chain_params);
    llama_sampler_chain_add(g_llm->sampler, llama_sampler_init_temp(0.7f));
    llama_sampler_chain_add(g_llm->sampler, llama_sampler_init_top_p(0.9f, 1));
    llama_sampler_chain_add(g_llm->sampler, llama_sampler_init_dist(42));

    g_llm->loaded = true;
    LOGI("Model loaded successfully. Context size: %d, Threads: %d", g_llm->n_ctx, g_llm->n_threads);

    return JNI_TRUE;
}

JNIEXPORT jstring JNICALL
Java_com_localaiassistant_llm_LLMBridge_runInference(
    JNIEnv* env,
    jobject /* this */,
    jstring prompt,
    jint maxTokens
) {
    std::lock_guard<std::mutex> lock(g_mutex);

    if (!g_llm || !g_llm->loaded) {
        LOGE("Model not loaded");
        return env->NewStringUTF("[Error: Model not loaded]");
    }

    const char* prompt_str = env->GetStringUTFChars(prompt, nullptr);
    if (!prompt_str) {
        return env->NewStringUTF("[Error: Invalid prompt]");
    }

    std::string prompt_text(prompt_str);
    env->ReleaseStringUTFChars(prompt, prompt_str);

    const llama_vocab* vocab = llama_model_get_vocab(g_llm->model);

    // Tokenize prompt
    int n_prompt_tokens = -llama_tokenize(vocab, prompt_text.c_str(), prompt_text.length(), nullptr, 0, true, true);
    std::vector<llama_token> tokens(n_prompt_tokens);
    llama_tokenize(vocab, prompt_text.c_str(), prompt_text.length(), tokens.data(), tokens.size(), true, true);

    if (tokens.empty()) {
        LOGE("Tokenization failed");
        return env->NewStringUTF("[Error: Tokenization failed]");
    }

    // Check context size
    if ((int)tokens.size() > g_llm->n_ctx) {
        LOGE("Prompt too long: %zu tokens > %d context", tokens.size(), g_llm->n_ctx);
        return env->NewStringUTF("[Error: Prompt exceeds context size]");
    }

    // Clear model memory before a fresh inference pass
    llama_memory_clear(llama_get_memory(g_llm->ctx), false);

    // Create batch and process prompt
    llama_batch batch = llama_batch_get_one(tokens.data(), tokens.size());
    if (llama_decode(g_llm->ctx, batch) != 0) {
        LOGE("Failed to decode prompt");
        return env->NewStringUTF("[Error: Decode failed]");
    }

    // Generate response
    std::string response;
    int max_gen = maxTokens > 0 ? maxTokens : 512;
    llama_token eos = llama_vocab_eos(vocab);

    for (int i = 0; i < max_gen; i++) {
        llama_token new_token = llama_sampler_sample(g_llm->sampler, g_llm->ctx, -1);

        if (llama_vocab_is_eog(vocab, new_token) || new_token == eos) {
            break;
        }

        // Convert token to text
        char buf[256];
        int n = llama_token_to_piece(vocab, new_token, buf, sizeof(buf), 0, true);
        if (n > 0) {
            response.append(buf, n);
        }

        // Prepare next batch
        llama_batch next_batch = llama_batch_get_one(&new_token, 1);
        if (llama_decode(g_llm->ctx, next_batch) != 0) {
            LOGE("Failed to decode token at position %d", i);
            break;
        }
    }

    LOGI("Generated %zu chars response", response.size());
    return env->NewStringUTF(response.c_str());
}

JNIEXPORT void JNICALL
Java_com_localaiassistant_llm_LLMBridge_unloadModel(
    JNIEnv* /* env */,
    jobject /* this */
) {
    std::lock_guard<std::mutex> lock(g_mutex);
    cleanup_context();
    llama_backend_free();
    LOGI("Model unloaded");
}

JNIEXPORT jboolean JNICALL
Java_com_localaiassistant_llm_LLMBridge_isModelLoaded(
    JNIEnv* /* env */,
    jobject /* this */
) {
    std::lock_guard<std::mutex> lock(g_mutex);
    return g_llm && g_llm->loaded ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jint JNICALL
Java_com_localaiassistant_llm_LLMBridge_getContextSize(
    JNIEnv* /* env */,
    jobject /* this */
) {
    std::lock_guard<std::mutex> lock(g_mutex);
    return g_llm ? g_llm->n_ctx : 0;
}

} // extern "C"

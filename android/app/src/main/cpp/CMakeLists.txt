cmake_minimum_required(VERSION 3.22.1)
project("localai_llm" CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# llama.cpp source directory (will be cloned into this path)
set(LLAMA_CPP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/llama.cpp")

# If llama.cpp sources exist, build from source
if(EXISTS "${LLAMA_CPP_DIR}/CMakeLists.txt")
    # Disable unnecessary features for mobile
    set(LLAMA_NATIVE OFF CACHE BOOL "" FORCE)
    set(LLAMA_BUILD_TESTS OFF CACHE BOOL "" FORCE)
    set(LLAMA_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
    set(LLAMA_BUILD_SERVER OFF CACHE BOOL "" FORCE)
    set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
    set(GGML_OPENMP OFF CACHE BOOL "" FORCE)

    add_subdirectory(${LLAMA_CPP_DIR} llama_build)

    # JNI Bridge library
    add_library(localai_llm SHARED
        llm_bridge.cpp
    )

    target_include_directories(localai_llm PRIVATE
        ${LLAMA_CPP_DIR}/include
        ${LLAMA_CPP_DIR}/ggml/include
    )

    target_link_libraries(localai_llm
        llama
        ggml
        android
        log
    )
else()
    # Fallback: build against pre-compiled .so
    add_library(llama SHARED IMPORTED)
    set_target_properties(llama PROPERTIES
        IMPORTED_LOCATION "${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}/libllama.so"
    )

    add_library(localai_llm SHARED
        llm_bridge.cpp
    )

    target_include_directories(localai_llm PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
    )

    target_link_libraries(localai_llm
        llama
        android
        log
    )
endif()

target_compile_options(localai_llm PRIVATE
    -O3
    -fPIC
    -DNDEBUG
)

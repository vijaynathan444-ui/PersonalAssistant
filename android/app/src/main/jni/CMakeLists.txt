cmake_minimum_required(VERSION 3.13)

# Build the React Native appmodules library (TurboModules, Fabric components)
project(appmodules)

# Include React Native's application cmake setup
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# Also build our custom LLM bridge
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../cpp localai_llm_build)

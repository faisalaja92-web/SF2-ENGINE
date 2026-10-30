cmake_minimum_required(VERSION 3.22.1)
project(nativeclarinet LANGUAGES CXX)

include(FetchContent)
FetchContent_Declare(
    oboe
    GIT_REPOSITORY https://github.com/google/oboe.git
    GIT_TAG 1.9.3
)
FetchContent_MakeAvailable(oboe)

add_library(nativeclarinet SHARED
    src/NativeClarinetJni.cpp
    src/ClarinetEngine.cpp
)

target_include_directories(nativeclarinet PRIVATE include)
target_compile_features(nativeclarinet PRIVATE cxx_std_17)
target_compile_options(nativeclarinet PRIVATE -Wall -Wextra -Werror=return-type)
target_link_libraries(nativeclarinet PRIVATE oboe log android)

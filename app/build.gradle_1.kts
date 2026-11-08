plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.narad.ai"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.narad.ai"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        // GitHub Secret se AI key build ke time APK me jaati hai
        buildConfigField("String", "JOBS_URL", "\"" + (System.getenv("JOBS_URL") ?: "") + "\"")
        buildConfigField("String", "AI_KEY", "\"" + (System.getenv("AI_API_KEY") ?: "") + "\"")
    }

    buildTypes {
        release { isMinifyEnabled = false }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.14" }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("com.google.android.gms:play-services-ads:23.3.0")
}

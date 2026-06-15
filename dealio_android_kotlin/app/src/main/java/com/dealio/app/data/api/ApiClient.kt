package com.dealio.app.data.api

import android.content.Context
import com.dealio.app.BuildConfig
import com.dealio.app.data.TokenStore
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    /**
     * Supplies the current JWT for the Authorization header. Wired up in
     * [init] so the authed builder/customer endpoints work after login.
     */
    @Volatile
    private var tokenProvider: () -> String? = { null }

    /** Call once (from MainActivity) so authed requests carry the JWT. */
    fun init(context: Context) {
        val store = TokenStore(context.applicationContext)
        tokenProvider = { store.accessToken }
    }

    private val okHttp: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val token = tokenProvider()
                val request = if (token.isNullOrBlank()) {
                    chain.request()
                } else {
                    chain.request().newBuilder()
                        .addHeader("Authorization", "Bearer $token")
                        .build()
                }
                chain.proceed(request)
            }
            .apply {
                if (BuildConfig.DEBUG) {
                    addInterceptor(HttpLoggingInterceptor().apply {
                        level = HttpLoggingInterceptor.Level.BASIC
                    })
                }
            }
            .build()
    }

    private val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttp)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val authApi: AuthApi by lazy { retrofit.create(AuthApi::class.java) }

    val builderApi: BuilderApi by lazy { retrofit.create(BuilderApi::class.java) }

    val customerApi: CustomerApi by lazy { retrofit.create(CustomerApi::class.java) }

    val cpApi: CpApi by lazy { retrofit.create(CpApi::class.java) }
}

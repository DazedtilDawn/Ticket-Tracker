package com.tickettracker.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;

public class SplashActivity extends Activity {
    // Splash screen display time in milliseconds
    private static final int SPLASH_DISPLAY_TIME = 2000; 

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);
        
        // Use a handler to delay loading the main activity
        new Handler().postDelayed(() -> {
            // Create an Intent that will start the main activity
            Intent mainIntent = new Intent(SplashActivity.this, MainActivity.class);
            startActivity(mainIntent);
            finish(); // Close the splash activity so it can't be returned to
        }, SPLASH_DISPLAY_TIME);
    }
}
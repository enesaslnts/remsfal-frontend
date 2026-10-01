package de.remsfal.app;

import android.os.CancellationSignal;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

/**
 * Capacitor plugin that obtains a Google ID token natively via the Android
 * Credential Manager (Google Identity Services), i.e. from the Google accounts
 * already registered on the device - without a browser redirect.
 *
 * JavaScript: NativeGoogleAuth.signIn({ serverClientId }) -> { idToken, email, displayName }
 *
 * The serverClientId is the OAuth client ID of the REMSFAL backend (web client).
 * Google issues the ID token for this audience; the Android OAuth client
 * (package name + SHA-1) only identifies this app towards Google.
 */
@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {

    private static final String TAG = "NativeGoogleAuth";

    @PluginMethod
    public void signIn(PluginCall call) {
        final String serverClientId = call.getString("serverClientId");
        if (serverClientId == null || serverClientId.isEmpty()) {
            call.reject("serverClientId is required", "MISSING_CLIENT_ID");
            return;
        }

        final GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
            // false: show all Google accounts on the device, not only accounts that used this app before
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(serverClientId)
            .setAutoSelectEnabled(false)
            .build();

        final GetCredentialRequest request = new GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build();

        final CredentialManager credentialManager = CredentialManager.create(getContext());
        credentialManager.getCredentialAsync(
            getActivity(),
            request,
            new CancellationSignal(),
            ContextCompat.getMainExecutor(getContext()),
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(GetCredentialResponse result) {
                    handleCredential(call, result.getCredential());
                }

                @Override
                public void onError(@NonNull GetCredentialException e) {
                    Log.w(TAG, "Google sign-in failed: " + e.getType(), e);
                    if (e instanceof GetCredentialCancellationException) {
                        call.reject("Sign-in cancelled by user", "CANCELLED", e);
                    } else if (e instanceof NoCredentialException) {
                        call.reject("No Google account available on this device", "NO_CREDENTIAL", e);
                    } else {
                        call.reject("Google sign-in failed: " + e.getMessage(), "SIGN_IN_FAILED", e);
                    }
                }
            });
    }

    private void handleCredential(PluginCall call, Credential credential) {
        if (credential instanceof CustomCredential
            && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
            try {
                final GoogleIdTokenCredential googleCredential =
                    GoogleIdTokenCredential.createFrom(credential.getData());
                final JSObject ret = new JSObject();
                ret.put("idToken", googleCredential.getIdToken());
                ret.put("email", googleCredential.getId());
                ret.put("displayName", googleCredential.getDisplayName());
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Invalid Google ID token credential", e);
                call.reject("Invalid Google ID token credential", "INVALID_CREDENTIAL", e);
            }
        } else {
            call.reject("Unexpected credential type: " + credential.getType(), "UNEXPECTED_CREDENTIAL");
        }
    }
}

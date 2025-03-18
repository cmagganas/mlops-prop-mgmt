import { CognitoUser, CognitoIdToken } from "amazon-cognito-identity-js";
import { Amplify, Auth } from "aws-amplify";
import { PropertyManagementConfig, defaultConfig } from "../config";

export const configureAmplifyCognitoAuthSingleton = (config: PropertyManagementConfig) => {
  let amplifyConfig = {
    Auth: {
      region: config.cognito_user_pool_region,
      userPoolId: config.cognito_user_pool_id,
      userPoolWebClientId: config.cognito_hosted_ui_app_client_id,
      // hosted UI configuration
      oauth: {
        domain: config.cognito_hosted_ui_fqdn,
        scope: config.cognito_hosted_ui_app_client_allowed_scopes,
        redirectSignIn: config.cognito_hosted_ui_redirect_sign_in_url,
        redirectSignOut: config.cognito_hosted_ui_redirect_sign_out_url,
        // or "token", note that REFRESH token will only be generated when the responseType is code
        responseType: "code",
      },
    },
  };

  Amplify.configure(amplifyConfig);
};

export const signOut = () => {
  // Instead of using Amplify's signOut, redirect to backend logout endpoint
  window.location.href = `${defaultConfig.backend_api_url}/auth/logout`;
};

// this redirects the user to a "hosted ui" where they can choose between
// cognito, Google, and any other OAuth identity providers that are set up
export const signInWithCognito = () => {
  Auth.federatedSignIn();
};

/**
 * Fetch the current user's Cognito ID Token from the browser.
 */
export const getUserIdToken = async (): Promise<CognitoIdToken> => {
  const userInfo: CognitoUser = await Auth.currentAuthenticatedUser();
  const userSession = userInfo.getSignInUserSession();
  const idToken: CognitoIdToken | undefined = await userSession?.getIdToken();
  if (idToken === undefined) {
    throw Error("Failed to fetch userIdToken. Is the user logged in?");
  }
  return idToken;
};

/**
 * Check if the user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    await Auth.currentAuthenticatedUser();
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Get the current authenticated user's information
 */
export const getCurrentUser = async () => {
  try {
    return await Auth.currentAuthenticatedUser();
  } catch (e) {
    return null;
  }
};

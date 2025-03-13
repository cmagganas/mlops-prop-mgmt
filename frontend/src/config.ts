import axios from "axios";

/**
 * Static configuration values for the frontend.
 */
export interface PropertyManagementConfig {
    /**
     * Base URL for the backend API.
     */
    readonly backend_api_url: string;

    /**
     * AWS Cognito configuration values.
     */
    readonly cognito_user_pool_id: string;
    readonly cognito_hosted_ui_app_client_id: string;
    readonly cognito_hosted_ui_app_client_allowed_scopes: Array<string>;
    readonly cognito_hosted_ui_fqdn: string;
    readonly cognito_user_pool_region: string;

    /**
     * URL to redirect to after a successful sign-in. This URL must be registered
     * with the cognito app client in advance.
     */
    readonly cognito_hosted_ui_redirect_sign_in_url: string;

    /**
     * URL to redirect to after a successful sign-out. This URL must be registered
     * with the cognito app client in advance.
     */
    readonly cognito_hosted_ui_redirect_sign_out_url: string;
}

/**
 * Fetch the global application config from the config.json file.
 */
export const fetchConfig = async (): Promise<PropertyManagementConfig> => {
    const url = isLocalhost() ? "/static/config.dev.json" : "/static/config.json";
    console.log("is localhost", isLocalhost(), url);
    const response: { data: PropertyManagementConfig } = await axios.get(url);

    // view the config so it exists without transformations
    const config = {
        ...response.data,
        backend_api_url: stripTrailingSlash(response.data.backend_api_url)
    };
    return config;
};

const stripTrailingSlash = (url: string): string => {
    if (url.endsWith("/")) {
        return url.slice(0, -1);
    }
    return url;
};

/**
 * Determine whether the window URL is localhost.
 * If not, we assume we are running in production.
 */
export const isLocalhost = () => Boolean(
    window.location.hostname === "localhost" ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === "[::1]" ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

// Default config with environment variables or defaults
export const defaultConfig: PropertyManagementConfig = {
    // Cognito User Pool Configuration
    cognito_user_pool_region: process.env.REACT_APP_COGNITO_REGION || 'us-west-1',
    cognito_user_pool_id: process.env.REACT_APP_COGNITO_USER_POOL_ID || 'us-west-1_ibylltjcj',
    cognito_hosted_ui_app_client_id: process.env.REACT_APP_COGNITO_APP_CLIENT_ID || '38bmld1m8v71in53pihbddrdji',
    cognito_hosted_ui_fqdn: process.env.REACT_APP_COGNITO_DOMAIN || 'property-mgmt.auth.us-west-1.amazoncognito.com',
    cognito_hosted_ui_app_client_allowed_scopes: ['openid', 'email', 'profile'],
    cognito_hosted_ui_redirect_sign_in_url: process.env.REACT_APP_REDIRECT_SIGN_IN || 'http://localhost:3000',
    cognito_hosted_ui_redirect_sign_out_url: process.env.REACT_APP_REDIRECT_SIGN_OUT || 'http://localhost:3000',
    
    // API Configuration
    backend_api_url: process.env.REACT_APP_API_URL || 'http://localhost:8000',
};

// For future use if we need to load config from other sources
export const getConfig = (): PropertyManagementConfig => {
    return defaultConfig;
};

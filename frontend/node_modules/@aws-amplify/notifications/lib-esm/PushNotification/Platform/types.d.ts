export interface Platform {
    OS: KnownOS | 'unknown';
}
declare type KnownOS = 'windows' | 'macos' | 'unix' | 'linux' | 'ios' | 'android' | 'web';
export {};

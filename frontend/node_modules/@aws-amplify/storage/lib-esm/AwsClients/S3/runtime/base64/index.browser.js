// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
function bytesToBase64(bytes) {
    var base64Str = Array.from(bytes, function (x) { return String.fromCodePoint(x); }).join('');
    return btoa(base64Str);
}
export function utf8Encode(input) {
    return new TextEncoder().encode(input);
}
export function toBase64(input) {
    if (typeof input === 'string') {
        return bytesToBase64(utf8Encode(input));
    }
    return bytesToBase64(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
}

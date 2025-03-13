// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import '@aws-amplify/core/polyfills/URL'; // TODO: [v6] install react-native-url-polyfill separately
export { SERVICE_NAME } from './base';
export { getObject, getPresignedGetObjectUrl, } from './getObject';
export { listObjectsV2, } from './listObjectsV2';
export { putObject } from './putObject';
export { createMultipartUpload, } from './createMultipartUpload';
export { uploadPart } from './uploadPart';
export { completeMultipartUpload, } from './completeMultipartUpload';
export { listParts } from './listParts';
export { abortMultipartUpload, } from './abortMultipartUpload';
export { copyObject } from './copyObject';
export { headObject } from './headObject';
export { deleteObject, } from './deleteObject';

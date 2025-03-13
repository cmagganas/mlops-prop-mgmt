// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { retryMiddleware, signingMiddleware, userAgentMiddleware, } from '@aws-amplify/core/internals/aws-client-utils';
import { composeTransferHandler } from '@aws-amplify/core/internals/aws-client-utils/composers';
import { contentSha256Middleware } from '../contentSha256middleware';
import { xhrTransferHandler } from '../xhrTransferHandler';
/**
 * S3 transfer handler for browser and React Native based on XHR. On top of basic transfer handler, it also supports
 * x-amz-content-sha256 header, and request&response process tracking.
 *
 * @internal
 */
export var s3TransferHandler = composeTransferHandler(xhrTransferHandler, [
    contentSha256Middleware,
    userAgentMiddleware,
    retryMiddleware,
    signingMiddleware,
]);

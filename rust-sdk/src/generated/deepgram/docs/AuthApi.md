# \AuthApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**auth_v1_tokens_grant**](AuthApi.md#auth_v1_tokens_grant) | **POST** /v1/auth/grant | Token-based Authentication



## auth_v1_tokens_grant

> models::GrantV1Response auth_v1_tokens_grant(grant_v1_request)
Token-based Authentication

Generates a temporary JSON Web Token (JWT) with a 30-second (by default) TTL and usage::write permission for core voice APIs, requiring an API key with Member or higher authorization. Tokens created with this endpoint will not work with the Manage APIs.

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**grant_v1_request** | Option<[**GrantV1Request**](GrantV1Request.md)> | Time to live settings |  |

### Return type

[**models::GrantV1Response**](GrantV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


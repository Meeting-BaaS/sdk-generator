# Gladia.SDK.Api.JobHistoryApi

All URIs are relative to *https://api.gladia.io*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**HistoryControllerGetListV1**](JobHistoryApi.md#historycontrollergetlistv1) | **GET** /v1/history | Get the history of all your jobs |

<a id="historycontrollergetlistv1"></a>
# **HistoryControllerGetListV1**
> ListHistoryResponse HistoryControllerGetListV1 (int offset = null, int limit = null, DateTime date = null, DateTime beforeDate = null, DateTime afterDate = null, List<string> status = null, Dictionary<string, Object> customMetadata = null, List<string> kind = null)

Get the history of all your jobs


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **offset** | **int** | The starting point for pagination. A value of 0 starts from the first item. | [optional] [default to 0] |
| **limit** | **int** | The maximum number of items to return. Useful for pagination and controlling data payload size. | [optional] [default to 20] |
| **date** | **DateTime** | Filter items relevant to a specific date in ISO format (YYYY-MM-DD). | [optional]  |
| **beforeDate** | **DateTime** | Include items that occurred before the specified date in ISO format. | [optional]  |
| **afterDate** | **DateTime** | Filter for items after the specified date. Use with &#x60;before_date&#x60; for a range. Date in ISO format. | [optional]  |
| **status** | [**List&lt;string&gt;**](string.md) | Filter the list based on item status. Accepts multiple values from the predefined list. | [optional]  |
| **customMetadata** | [**Dictionary&lt;string, Object&gt;**](Object.md) |  | [optional]  |
| **kind** | [**List&lt;string&gt;**](string.md) | Filter the list based on the item type. Supports multiple values from the predefined list. | [optional]  |

### Return type

[**ListHistoryResponse**](ListHistoryResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | A list of jobs |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)


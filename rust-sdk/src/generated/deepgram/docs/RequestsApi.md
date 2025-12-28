# \RequestsApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**manage_v1_projects_requests_get**](RequestsApi.md#manage_v1_projects_requests_get) | **GET** /v1/projects/{project_id}/requests/{request_id} | Get a Project Request
[**manage_v1_projects_requests_list**](RequestsApi.md#manage_v1_projects_requests_list) | **GET** /v1/projects/{project_id}/requests | List Project Requests



## manage_v1_projects_requests_get

> models::GetProjectRequestV1Response manage_v1_projects_requests_get(project_id, request_id)
Get a Project Request

Retrieves a specific request for a specific project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**request_id** | **String** | The unique identifier of the request | [required] |

### Return type

[**models::GetProjectRequestV1Response**](GetProjectRequestV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_requests_list

> models::ListProjectRequestsV1Response manage_v1_projects_requests_list(project_id, start, end, limit, page, accessor, request_id, deployment, endpoint, method, status)
List Project Requests

Generates a list of requests for a specific project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**start** | Option<**String**> | Start date of the requested date range. Formats accepted are YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS, or YYYY-MM-DDTHH:MM:SS+HH:MM |  |
**end** | Option<**String**> | End date of the requested date range. Formats accepted are YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS, or YYYY-MM-DDTHH:MM:SS+HH:MM |  |
**limit** | Option<**f64**> | Number of results to return per page. Default 10. Range [1,1000] |  |[default to 10]
**page** | Option<**f64**> | Navigate and return the results to retrieve specific portions of information of the response |  |
**accessor** | Option<**String**> | Filter for requests where a specific accessor was used |  |
**request_id** | Option<**String**> | Filter for a specific request id |  |
**deployment** | Option<**String**> | Filter for requests where a specific deployment was used |  |
**endpoint** | Option<**String**> | Filter for requests where a specific endpoint was used |  |
**method** | Option<**String**> | Filter for requests where a specific method was used |  |
**status** | Option<**String**> | Filter for requests that succeeded (status code < 300) or failed (status code >=400) |  |

### Return type

[**models::ListProjectRequestsV1Response**](ListProjectRequestsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


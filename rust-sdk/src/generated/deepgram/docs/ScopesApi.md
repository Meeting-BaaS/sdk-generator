# \ScopesApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**manage_projects_members_scopes_update**](ScopesApi.md#manage_projects_members_scopes_update) | **PUT** /v1/projects/{project_id}/members/{member_id}/scopes | Update Project Member Scopes
[**manage_v1_projects_members_scopes_list**](ScopesApi.md#manage_v1_projects_members_scopes_list) | **GET** /v1/projects/{project_id}/members/{member_id}/scopes | List Project Member Scopes



## manage_projects_members_scopes_update

> models::UpdateProjectMemberScopesV1Response manage_projects_members_scopes_update(project_id, member_id, update_project_member_scopes_v1_request)
Update Project Member Scopes

Updates the scopes for a specific member

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**member_id** | **String** | The unique identifier of the Member | [required] |
**update_project_member_scopes_v1_request** | Option<[**UpdateProjectMemberScopesV1Request**](UpdateProjectMemberScopesV1Request.md)> | A scope to update |  |

### Return type

[**models::UpdateProjectMemberScopesV1Response**](UpdateProjectMemberScopesV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_members_scopes_list

> models::ListProjectMemberScopesV1Response manage_v1_projects_members_scopes_list(project_id, member_id)
List Project Member Scopes

Retrieves a list of scopes for a specific member

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**member_id** | **String** | The unique identifier of the Member | [required] |

### Return type

[**models::ListProjectMemberScopesV1Response**](ListProjectMemberScopesV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


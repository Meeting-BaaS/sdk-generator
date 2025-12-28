# \InvitesApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**manage_v1_projects_members_invites_create**](InvitesApi.md#manage_v1_projects_members_invites_create) | **POST** /v1/projects/{project_id}/invites | Create a Project Invite
[**manage_v1_projects_members_invites_delete**](InvitesApi.md#manage_v1_projects_members_invites_delete) | **DELETE** /v1/projects/{project_id}/invites/{email} | Delete a Project Invite
[**manage_v1_projects_members_invites_list**](InvitesApi.md#manage_v1_projects_members_invites_list) | **GET** /v1/projects/{project_id}/invites | List Project Invites



## manage_v1_projects_members_invites_create

> models::CreateProjectInviteV1Response manage_v1_projects_members_invites_create(project_id, create_project_invite_v1_request)
Create a Project Invite

Generates an invite for a specific project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**create_project_invite_v1_request** | Option<[**CreateProjectInviteV1Request**](CreateProjectInviteV1Request.md)> | email to invite to the project |  |

### Return type

[**models::CreateProjectInviteV1Response**](CreateProjectInviteV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_members_invites_delete

> models::DeleteProjectInviteV1Response manage_v1_projects_members_invites_delete(project_id, email)
Delete a Project Invite

Deletes an invite for a specific project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**email** | **String** | The email address of the member | [required] |

### Return type

[**models::DeleteProjectInviteV1Response**](DeleteProjectInviteV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_members_invites_list

> models::ListProjectInvitesV1Response manage_v1_projects_members_invites_list(project_id)
List Project Invites

Generates a list of invites for a specific project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |

### Return type

[**models::ListProjectInvitesV1Response**](ListProjectInvitesV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


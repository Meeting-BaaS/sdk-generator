# \MembersApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**manage_projects_members_scopes_update**](MembersApi.md#manage_projects_members_scopes_update) | **PUT** /v1/projects/{project_id}/members/{member_id}/scopes | Update Project Member Scopes
[**manage_v1_projects_members_delete**](MembersApi.md#manage_v1_projects_members_delete) | **DELETE** /v1/projects/{project_id}/members/{member_id} | Delete a Project Member
[**manage_v1_projects_members_invites_create**](MembersApi.md#manage_v1_projects_members_invites_create) | **POST** /v1/projects/{project_id}/invites | Create a Project Invite
[**manage_v1_projects_members_invites_delete**](MembersApi.md#manage_v1_projects_members_invites_delete) | **DELETE** /v1/projects/{project_id}/invites/{email} | Delete a Project Invite
[**manage_v1_projects_members_invites_list**](MembersApi.md#manage_v1_projects_members_invites_list) | **GET** /v1/projects/{project_id}/invites | List Project Invites
[**manage_v1_projects_members_list**](MembersApi.md#manage_v1_projects_members_list) | **GET** /v1/projects/{project_id}/members | List Project Members
[**manage_v1_projects_members_scopes_list**](MembersApi.md#manage_v1_projects_members_scopes_list) | **GET** /v1/projects/{project_id}/members/{member_id}/scopes | List Project Member Scopes



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


## manage_v1_projects_members_delete

> models::DeleteProjectMemberV1Response manage_v1_projects_members_delete(project_id, member_id)
Delete a Project Member

Removes a member from the project using their unique member ID

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**member_id** | **String** | The unique identifier of the Member | [required] |

### Return type

[**models::DeleteProjectMemberV1Response**](DeleteProjectMemberV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


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


## manage_v1_projects_members_list

> models::ListProjectMembersV1Response manage_v1_projects_members_list(project_id)
List Project Members

Retrieves a list of members for a given project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |

### Return type

[**models::ListProjectMembersV1Response**](ListProjectMembersV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
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


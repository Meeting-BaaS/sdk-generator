# \ManageApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**manage_projects_delete**](ManageApi.md#manage_projects_delete) | **DELETE** /v1/projects/{project_id} | Delete a Project
[**manage_projects_keys_create**](ManageApi.md#manage_projects_keys_create) | **POST** /v1/projects/{project_id}/keys | Create a Project Key
[**manage_projects_keys_delete**](ManageApi.md#manage_projects_keys_delete) | **DELETE** /v1/projects/{project_id}/keys/{key_id} | Delete a Project Key
[**manage_projects_members_scopes_update**](ManageApi.md#manage_projects_members_scopes_update) | **PUT** /v1/projects/{project_id}/members/{member_id}/scopes | Update Project Member Scopes
[**manage_projects_update**](ManageApi.md#manage_projects_update) | **PATCH** /v1/projects/{project_id} | Update a Project
[**manage_v1_models_get**](ManageApi.md#manage_v1_models_get) | **GET** /v1/models/{model_id} | Get a specific Model
[**manage_v1_models_list**](ManageApi.md#manage_v1_models_list) | **GET** /v1/models | List Models
[**manage_v1_projects_billing_balances_get**](ManageApi.md#manage_v1_projects_billing_balances_get) | **GET** /v1/projects/{project_id}/balances/{balance_id} | Get a Project Balance
[**manage_v1_projects_billing_balances_list**](ManageApi.md#manage_v1_projects_billing_balances_list) | **GET** /v1/projects/{project_id}/balances | Get Project Balances
[**manage_v1_projects_billing_breakdown_list**](ManageApi.md#manage_v1_projects_billing_breakdown_list) | **GET** /v1/projects/{project_id}/billing/breakdown | Get Project Billing Breakdown
[**manage_v1_projects_billing_fields_list**](ManageApi.md#manage_v1_projects_billing_fields_list) | **GET** /v1/projects/{project_id}/billing/fields | List Project Billing Fields
[**manage_v1_projects_billing_purchases_list**](ManageApi.md#manage_v1_projects_billing_purchases_list) | **GET** /v1/projects/{project_id}/purchases | List Project Purchases
[**manage_v1_projects_get**](ManageApi.md#manage_v1_projects_get) | **GET** /v1/projects/{project_id} | Get a Project
[**manage_v1_projects_keys_get**](ManageApi.md#manage_v1_projects_keys_get) | **GET** /v1/projects/{project_id}/keys/{key_id} | Get a Project Key
[**manage_v1_projects_keys_list**](ManageApi.md#manage_v1_projects_keys_list) | **GET** /v1/projects/{project_id}/keys | List Project Keys
[**manage_v1_projects_leave**](ManageApi.md#manage_v1_projects_leave) | **DELETE** /v1/projects/{project_id}/leave | Leave a Project
[**manage_v1_projects_list**](ManageApi.md#manage_v1_projects_list) | **GET** /v1/projects | List Projects
[**manage_v1_projects_members_delete**](ManageApi.md#manage_v1_projects_members_delete) | **DELETE** /v1/projects/{project_id}/members/{member_id} | Delete a Project Member
[**manage_v1_projects_members_invites_create**](ManageApi.md#manage_v1_projects_members_invites_create) | **POST** /v1/projects/{project_id}/invites | Create a Project Invite
[**manage_v1_projects_members_invites_delete**](ManageApi.md#manage_v1_projects_members_invites_delete) | **DELETE** /v1/projects/{project_id}/invites/{email} | Delete a Project Invite
[**manage_v1_projects_members_invites_list**](ManageApi.md#manage_v1_projects_members_invites_list) | **GET** /v1/projects/{project_id}/invites | List Project Invites
[**manage_v1_projects_members_list**](ManageApi.md#manage_v1_projects_members_list) | **GET** /v1/projects/{project_id}/members | List Project Members
[**manage_v1_projects_members_scopes_list**](ManageApi.md#manage_v1_projects_members_scopes_list) | **GET** /v1/projects/{project_id}/members/{member_id}/scopes | List Project Member Scopes
[**manage_v1_projects_models_get**](ManageApi.md#manage_v1_projects_models_get) | **GET** /v1/projects/{project_id}/models/{model_id} | Get a Project Model
[**manage_v1_projects_models_list**](ManageApi.md#manage_v1_projects_models_list) | **GET** /v1/projects/{project_id}/models | List Project Models
[**manage_v1_projects_requests_get**](ManageApi.md#manage_v1_projects_requests_get) | **GET** /v1/projects/{project_id}/requests/{request_id} | Get a Project Request
[**manage_v1_projects_requests_list**](ManageApi.md#manage_v1_projects_requests_list) | **GET** /v1/projects/{project_id}/requests | List Project Requests
[**manage_v1_projects_usage_breakdown_get**](ManageApi.md#manage_v1_projects_usage_breakdown_get) | **GET** /v1/projects/{project_id}/usage/breakdown | Get Project Usage Breakdown
[**manage_v1_projects_usage_fields_list**](ManageApi.md#manage_v1_projects_usage_fields_list) | **GET** /v1/projects/{project_id}/usage/fields | List Project Usage Fields
[**manage_v1_projects_usage_get**](ManageApi.md#manage_v1_projects_usage_get) | **GET** /v1/projects/{project_id}/usage | Get Project Usage



## manage_projects_delete

> models::DeleteProjectV1Response manage_projects_delete(project_id)
Delete a Project

Deletes the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |

### Return type

[**models::DeleteProjectV1Response**](DeleteProjectV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_projects_keys_create

> models::CreateKeyV1Response manage_projects_keys_create(project_id, create_key_v1_request)
Create a Project Key

Creates a new API key with specified settings for the project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**create_key_v1_request** | Option<[**CreateKeyV1Request**](CreateKeyV1Request.md)> | API key settings | [required] |

### Return type

[**models::CreateKeyV1Response**](CreateKeyV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_projects_keys_delete

> models::DeleteProjectKeyV1Response manage_projects_keys_delete(project_id, key_id)
Delete a Project Key

Deletes an API key for a specific project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**key_id** | **String** | The unique identifier of the API key | [required] |

### Return type

[**models::DeleteProjectKeyV1Response**](DeleteProjectKeyV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


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


## manage_projects_update

> models::UpdateProjectV1Response manage_projects_update(project_id, update_project_v1_request)
Update a Project

Updates the name or other properties of an existing project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**update_project_v1_request** | Option<[**UpdateProjectV1Request**](UpdateProjectV1Request.md)> | The name of the project |  |

### Return type

[**models::UpdateProjectV1Response**](UpdateProjectV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_models_get

> models::GetModelV1Response manage_v1_models_get(model_id)
Get a specific Model

Returns metadata for a specific public model

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**model_id** | **String** | The specific UUID of the model | [required] |

### Return type

[**models::GetModelV1Response**](GetModelV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_models_list

> models::ListModelsV1Response manage_v1_models_list(include_outdated)
List Models

Returns metadata on all the latest public models. To retrieve custom models, use Get Project Models.

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**include_outdated** | Option<**bool**> | returns non-latest versions of models |  |

### Return type

[**models::ListModelsV1Response**](ListModelsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_billing_balances_get

> models::GetProjectBalanceV1Response manage_v1_projects_billing_balances_get(project_id, balance_id)
Get a Project Balance

Retrieves details about the specified balance

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**balance_id** | **String** | The unique identifier of the balance | [required] |

### Return type

[**models::GetProjectBalanceV1Response**](GetProjectBalanceV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_billing_balances_list

> models::ListProjectBalancesV1Response manage_v1_projects_billing_balances_list(project_id)
Get Project Balances

Generates a list of outstanding balances for the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |

### Return type

[**models::ListProjectBalancesV1Response**](ListProjectBalancesV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_billing_breakdown_list

> models::BillingBreakdownV1Response manage_v1_projects_billing_breakdown_list(project_id, start, end, accessor, deployment, tag, line_item, grouping)
Get Project Billing Breakdown

Retrieves the billing summary for a specific project, with various filter options or by grouping options.

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**start** | Option<**String**> | Start date of the requested date range. Format accepted is YYYY-MM-DD |  |
**end** | Option<**String**> | End date of the requested date range. Format accepted is YYYY-MM-DD |  |
**accessor** | Option<**String**> | Filter for requests where a specific accessor was used |  |
**deployment** | Option<**String**> | Filter for requests where a specific deployment was used |  |
**tag** | Option<**String**> | Filter for requests where a specific tag was used |  |
**line_item** | Option<**String**> | Filter requests by line item (e.g. streaming::nova-3) |  |
**grouping** | Option<[**Vec<String>**](String.md)> | Group billing breakdown by one or more dimensions (accessor, deployment, line_item, tags) |  |

### Return type

[**models::BillingBreakdownV1Response**](BillingBreakdownV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_billing_fields_list

> models::ListBillingFieldsV1Response manage_v1_projects_billing_fields_list(project_id, start, end)
List Project Billing Fields

Lists the accessors, deployment types, tags, and line items used for billing data in the specified time period. Use this endpoint if you want to filter your results from the Billing Breakdown endpoint and want to know what filters are available.

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**start** | Option<**String**> | Start date of the requested date range. Format accepted is YYYY-MM-DD |  |
**end** | Option<**String**> | End date of the requested date range. Format accepted is YYYY-MM-DD |  |

### Return type

[**models::ListBillingFieldsV1Response**](ListBillingFieldsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_billing_purchases_list

> models::ListProjectPurchasesV1Response manage_v1_projects_billing_purchases_list(project_id, limit)
List Project Purchases

Returns the original purchased amount on an order transaction

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**limit** | Option<**f64**> | Number of results to return per page. Default 10. Range [1,1000] |  |[default to 10]

### Return type

[**models::ListProjectPurchasesV1Response**](ListProjectPurchasesV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_get

> models::GetProjectV1Response manage_v1_projects_get(project_id, limit, page)
Get a Project

Retrieves information about the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**limit** | Option<**f64**> | Number of results to return per page. Default 10. Range [1,1000] |  |[default to 10]
**page** | Option<**f64**> | Navigate and return the results to retrieve specific portions of information of the response |  |

### Return type

[**models::GetProjectV1Response**](GetProjectV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_keys_get

> models::GetProjectKeyV1Response manage_v1_projects_keys_get(project_id, key_id)
Get a Project Key

Retrieves information about a specified API key

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**key_id** | **String** | The unique identifier of the API key | [required] |

### Return type

[**models::GetProjectKeyV1Response**](GetProjectKeyV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_keys_list

> models::ListProjectKeysV1Response manage_v1_projects_keys_list(project_id, status)
List Project Keys

Retrieves all API keys associated with the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**status** | Option<**String**> | Only return keys with a specific status |  |

### Return type

[**models::ListProjectKeysV1Response**](ListProjectKeysV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_leave

> models::LeaveProjectV1Response manage_v1_projects_leave(project_id)
Leave a Project

Removes the authenticated account from the specific project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |

### Return type

[**models::LeaveProjectV1Response**](LeaveProjectV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_list

> models::ListProjectsV1Response manage_v1_projects_list()
List Projects

Retrieves basic information about the projects associated with the API key

### Parameters

This endpoint does not need any parameter.

### Return type

[**models::ListProjectsV1Response**](ListProjectsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
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


## manage_v1_projects_models_get

> models::GetModelV1Response manage_v1_projects_models_get(project_id, model_id)
Get a Project Model

Returns metadata for a specific model

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**model_id** | **String** | The specific UUID of the model | [required] |

### Return type

[**models::GetModelV1Response**](GetModelV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_models_list

> models::ListModelsV1Response manage_v1_projects_models_list(project_id, include_outdated)
List Project Models

Returns metadata on all the latest models that a specific project has access to, including non-public models

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**include_outdated** | Option<**bool**> | returns non-latest versions of models |  |

### Return type

[**models::ListModelsV1Response**](ListModelsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


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


## manage_v1_projects_usage_breakdown_get

> models::UsageBreakdownV1Response manage_v1_projects_usage_breakdown_get(project_id, start, end, grouping, accessor, alternatives, callback_method, callback, channels, custom_intent_mode, custom_intent, custom_topic_mode, custom_topic, deployment, detect_entities, detect_language, diarize, dictation, encoding, endpoint, extra, filler_words, intents, keyterm, keywords, language, measurements, method, model, multichannel, numerals, paragraphs, profanity_filter, punctuate, redact, replace, sample_rate, search, sentiment, smart_format, summarize, tag, topics, utt_split, utterances, version)
Get Project Usage Breakdown

Retrieves the usage breakdown for a specific project, with various filter options by API feature or by groupings. Setting a feature (e.g. diarize) to true includes requests that used that feature, while false excludes requests that used it. Multiple true filters are combined with OR logic, while false filters use AND logic.

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**start** | Option<**String**> | Start date of the requested date range. Format accepted is YYYY-MM-DD |  |
**end** | Option<**String**> | End date of the requested date range. Format accepted is YYYY-MM-DD |  |
**grouping** | Option<**String**> | Common usage grouping parameters |  |
**accessor** | Option<**String**> | Filter for requests where a specific accessor was used |  |
**alternatives** | Option<**bool**> | Filter for requests where alternatives were used |  |
**callback_method** | Option<**bool**> | Filter for requests where callback method was used |  |
**callback** | Option<**bool**> | Filter for requests where callback was used |  |
**channels** | Option<**bool**> | Filter for requests where channels were used |  |
**custom_intent_mode** | Option<**bool**> | Filter for requests where custom intent mode was used |  |
**custom_intent** | Option<**bool**> | Filter for requests where custom intent was used |  |
**custom_topic_mode** | Option<**bool**> | Filter for requests where custom topic mode was used |  |
**custom_topic** | Option<**bool**> | Filter for requests where custom topic was used |  |
**deployment** | Option<**String**> | Filter for requests where a specific deployment was used |  |
**detect_entities** | Option<**bool**> | Filter for requests where detect entities was used |  |
**detect_language** | Option<**bool**> | Filter for requests where detect language was used |  |
**diarize** | Option<**bool**> | Filter for requests where diarize was used |  |
**dictation** | Option<**bool**> | Filter for requests where dictation was used |  |
**encoding** | Option<**bool**> | Filter for requests where encoding was used |  |
**endpoint** | Option<**String**> | Filter for requests where a specific endpoint was used |  |
**extra** | Option<**bool**> | Filter for requests where extra was used |  |
**filler_words** | Option<**bool**> | Filter for requests where filler words was used |  |
**intents** | Option<**bool**> | Filter for requests where intents was used |  |
**keyterm** | Option<**bool**> | Filter for requests where keyterm was used |  |
**keywords** | Option<**bool**> | Filter for requests where keywords was used |  |
**language** | Option<**bool**> | Filter for requests where language was used |  |
**measurements** | Option<**bool**> | Filter for requests where measurements were used |  |
**method** | Option<**String**> | Filter for requests where a specific method was used |  |
**model** | Option<**String**> | Filter for requests where a specific model uuid was used |  |
**multichannel** | Option<**bool**> | Filter for requests where multichannel was used |  |
**numerals** | Option<**bool**> | Filter for requests where numerals were used |  |
**paragraphs** | Option<**bool**> | Filter for requests where paragraphs were used |  |
**profanity_filter** | Option<**bool**> | Filter for requests where profanity filter was used |  |
**punctuate** | Option<**bool**> | Filter for requests where punctuate was used |  |
**redact** | Option<**bool**> | Filter for requests where redact was used |  |
**replace** | Option<**bool**> | Filter for requests where replace was used |  |
**sample_rate** | Option<**bool**> | Filter for requests where sample rate was used |  |
**search** | Option<**bool**> | Filter for requests where search was used |  |
**sentiment** | Option<**bool**> | Filter for requests where sentiment was used |  |
**smart_format** | Option<**bool**> | Filter for requests where smart format was used |  |
**summarize** | Option<**bool**> | Filter for requests where summarize was used |  |
**tag** | Option<**String**> | Filter for requests where a specific tag was used |  |
**topics** | Option<**bool**> | Filter for requests where topics was used |  |
**utt_split** | Option<**bool**> | Filter for requests where utt split was used |  |
**utterances** | Option<**bool**> | Filter for requests where utterances was used |  |
**version** | Option<**bool**> | Filter for requests where version was used |  |

### Return type

[**models::UsageBreakdownV1Response**](UsageBreakdownV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_usage_fields_list

> models::UsageFieldsV1Response manage_v1_projects_usage_fields_list(project_id, start, end)
List Project Usage Fields

Lists the features, models, tags, languages, and processing method used for requests in the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**start** | Option<**String**> | Start date of the requested date range. Format accepted is YYYY-MM-DD |  |
**end** | Option<**String**> | End date of the requested date range. Format accepted is YYYY-MM-DD |  |

### Return type

[**models::UsageFieldsV1Response**](UsageFieldsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_usage_get

> models::UsageV1Response manage_v1_projects_usage_get(project_id, start, end, accessor, alternatives, callback_method, callback, channels, custom_intent_mode, custom_intent, custom_topic_mode, custom_topic, deployment, detect_entities, detect_language, diarize, dictation, encoding, endpoint, extra, filler_words, intents, keyterm, keywords, language, measurements, method, model, multichannel, numerals, paragraphs, profanity_filter, punctuate, redact, replace, sample_rate, search, sentiment, smart_format, summarize, tag, topics, utt_split, utterances, version)
Get Project Usage

Retrieves the usage for a specific project. Use Get Project Usage Breakdown for a more comprehensive usage summary.

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**start** | Option<**String**> | Start date of the requested date range. Format accepted is YYYY-MM-DD |  |
**end** | Option<**String**> | End date of the requested date range. Format accepted is YYYY-MM-DD |  |
**accessor** | Option<**String**> | Filter for requests where a specific accessor was used |  |
**alternatives** | Option<**bool**> | Filter for requests where alternatives were used |  |
**callback_method** | Option<**bool**> | Filter for requests where callback method was used |  |
**callback** | Option<**bool**> | Filter for requests where callback was used |  |
**channels** | Option<**bool**> | Filter for requests where channels were used |  |
**custom_intent_mode** | Option<**bool**> | Filter for requests where custom intent mode was used |  |
**custom_intent** | Option<**bool**> | Filter for requests where custom intent was used |  |
**custom_topic_mode** | Option<**bool**> | Filter for requests where custom topic mode was used |  |
**custom_topic** | Option<**bool**> | Filter for requests where custom topic was used |  |
**deployment** | Option<**String**> | Filter for requests where a specific deployment was used |  |
**detect_entities** | Option<**bool**> | Filter for requests where detect entities was used |  |
**detect_language** | Option<**bool**> | Filter for requests where detect language was used |  |
**diarize** | Option<**bool**> | Filter for requests where diarize was used |  |
**dictation** | Option<**bool**> | Filter for requests where dictation was used |  |
**encoding** | Option<**bool**> | Filter for requests where encoding was used |  |
**endpoint** | Option<**String**> | Filter for requests where a specific endpoint was used |  |
**extra** | Option<**bool**> | Filter for requests where extra was used |  |
**filler_words** | Option<**bool**> | Filter for requests where filler words was used |  |
**intents** | Option<**bool**> | Filter for requests where intents was used |  |
**keyterm** | Option<**bool**> | Filter for requests where keyterm was used |  |
**keywords** | Option<**bool**> | Filter for requests where keywords was used |  |
**language** | Option<**bool**> | Filter for requests where language was used |  |
**measurements** | Option<**bool**> | Filter for requests where measurements were used |  |
**method** | Option<**String**> | Filter for requests where a specific method was used |  |
**model** | Option<**String**> | Filter for requests where a specific model uuid was used |  |
**multichannel** | Option<**bool**> | Filter for requests where multichannel was used |  |
**numerals** | Option<**bool**> | Filter for requests where numerals were used |  |
**paragraphs** | Option<**bool**> | Filter for requests where paragraphs were used |  |
**profanity_filter** | Option<**bool**> | Filter for requests where profanity filter was used |  |
**punctuate** | Option<**bool**> | Filter for requests where punctuate was used |  |
**redact** | Option<**bool**> | Filter for requests where redact was used |  |
**replace** | Option<**bool**> | Filter for requests where replace was used |  |
**sample_rate** | Option<**bool**> | Filter for requests where sample rate was used |  |
**search** | Option<**bool**> | Filter for requests where search was used |  |
**sentiment** | Option<**bool**> | Filter for requests where sentiment was used |  |
**smart_format** | Option<**bool**> | Filter for requests where smart format was used |  |
**summarize** | Option<**bool**> | Filter for requests where summarize was used |  |
**tag** | Option<**String**> | Filter for requests where a specific tag was used |  |
**topics** | Option<**bool**> | Filter for requests where topics was used |  |
**utt_split** | Option<**bool**> | Filter for requests where utt split was used |  |
**utterances** | Option<**bool**> | Filter for requests where utterances was used |  |
**version** | Option<**bool**> | Filter for requests where version was used |  |

### Return type

[**models::UsageV1Response**](UsageV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


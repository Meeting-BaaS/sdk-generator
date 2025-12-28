# \V1Api

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**agent_v1_settings_think_models_list**](V1Api.md#agent_v1_settings_think_models_list) | **GET** /v1/agent/settings/think/models | List Agent Think Models
[**auth_v1_tokens_grant**](V1Api.md#auth_v1_tokens_grant) | **POST** /v1/auth/grant | Token-based Authentication
[**listen_v1_media_transcribe**](V1Api.md#listen_v1_media_transcribe) | **POST** /v1/listen | Transcribe and analyze pre-recorded audio and video
[**manage_projects_delete**](V1Api.md#manage_projects_delete) | **DELETE** /v1/projects/{project_id} | Delete a Project
[**manage_projects_keys_create**](V1Api.md#manage_projects_keys_create) | **POST** /v1/projects/{project_id}/keys | Create a Project Key
[**manage_projects_keys_delete**](V1Api.md#manage_projects_keys_delete) | **DELETE** /v1/projects/{project_id}/keys/{key_id} | Delete a Project Key
[**manage_projects_members_scopes_update**](V1Api.md#manage_projects_members_scopes_update) | **PUT** /v1/projects/{project_id}/members/{member_id}/scopes | Update Project Member Scopes
[**manage_projects_update**](V1Api.md#manage_projects_update) | **PATCH** /v1/projects/{project_id} | Update a Project
[**manage_v1_models_get**](V1Api.md#manage_v1_models_get) | **GET** /v1/models/{model_id} | Get a specific Model
[**manage_v1_models_list**](V1Api.md#manage_v1_models_list) | **GET** /v1/models | List Models
[**manage_v1_projects_billing_balances_get**](V1Api.md#manage_v1_projects_billing_balances_get) | **GET** /v1/projects/{project_id}/balances/{balance_id} | Get a Project Balance
[**manage_v1_projects_billing_balances_list**](V1Api.md#manage_v1_projects_billing_balances_list) | **GET** /v1/projects/{project_id}/balances | Get Project Balances
[**manage_v1_projects_billing_breakdown_list**](V1Api.md#manage_v1_projects_billing_breakdown_list) | **GET** /v1/projects/{project_id}/billing/breakdown | Get Project Billing Breakdown
[**manage_v1_projects_billing_fields_list**](V1Api.md#manage_v1_projects_billing_fields_list) | **GET** /v1/projects/{project_id}/billing/fields | List Project Billing Fields
[**manage_v1_projects_billing_purchases_list**](V1Api.md#manage_v1_projects_billing_purchases_list) | **GET** /v1/projects/{project_id}/purchases | List Project Purchases
[**manage_v1_projects_get**](V1Api.md#manage_v1_projects_get) | **GET** /v1/projects/{project_id} | Get a Project
[**manage_v1_projects_keys_get**](V1Api.md#manage_v1_projects_keys_get) | **GET** /v1/projects/{project_id}/keys/{key_id} | Get a Project Key
[**manage_v1_projects_keys_list**](V1Api.md#manage_v1_projects_keys_list) | **GET** /v1/projects/{project_id}/keys | List Project Keys
[**manage_v1_projects_leave**](V1Api.md#manage_v1_projects_leave) | **DELETE** /v1/projects/{project_id}/leave | Leave a Project
[**manage_v1_projects_list**](V1Api.md#manage_v1_projects_list) | **GET** /v1/projects | List Projects
[**manage_v1_projects_members_delete**](V1Api.md#manage_v1_projects_members_delete) | **DELETE** /v1/projects/{project_id}/members/{member_id} | Delete a Project Member
[**manage_v1_projects_members_invites_create**](V1Api.md#manage_v1_projects_members_invites_create) | **POST** /v1/projects/{project_id}/invites | Create a Project Invite
[**manage_v1_projects_members_invites_delete**](V1Api.md#manage_v1_projects_members_invites_delete) | **DELETE** /v1/projects/{project_id}/invites/{email} | Delete a Project Invite
[**manage_v1_projects_members_invites_list**](V1Api.md#manage_v1_projects_members_invites_list) | **GET** /v1/projects/{project_id}/invites | List Project Invites
[**manage_v1_projects_members_list**](V1Api.md#manage_v1_projects_members_list) | **GET** /v1/projects/{project_id}/members | List Project Members
[**manage_v1_projects_members_scopes_list**](V1Api.md#manage_v1_projects_members_scopes_list) | **GET** /v1/projects/{project_id}/members/{member_id}/scopes | List Project Member Scopes
[**manage_v1_projects_models_get**](V1Api.md#manage_v1_projects_models_get) | **GET** /v1/projects/{project_id}/models/{model_id} | Get a Project Model
[**manage_v1_projects_models_list**](V1Api.md#manage_v1_projects_models_list) | **GET** /v1/projects/{project_id}/models | List Project Models
[**manage_v1_projects_requests_get**](V1Api.md#manage_v1_projects_requests_get) | **GET** /v1/projects/{project_id}/requests/{request_id} | Get a Project Request
[**manage_v1_projects_requests_list**](V1Api.md#manage_v1_projects_requests_list) | **GET** /v1/projects/{project_id}/requests | List Project Requests
[**manage_v1_projects_usage_breakdown_get**](V1Api.md#manage_v1_projects_usage_breakdown_get) | **GET** /v1/projects/{project_id}/usage/breakdown | Get Project Usage Breakdown
[**manage_v1_projects_usage_fields_list**](V1Api.md#manage_v1_projects_usage_fields_list) | **GET** /v1/projects/{project_id}/usage/fields | List Project Usage Fields
[**manage_v1_projects_usage_get**](V1Api.md#manage_v1_projects_usage_get) | **GET** /v1/projects/{project_id}/usage | Get Project Usage
[**read_v1_text_analyze**](V1Api.md#read_v1_text_analyze) | **POST** /v1/read | Analyze text content
[**self_hosted_v1_distribution_credentials_create**](V1Api.md#self_hosted_v1_distribution_credentials_create) | **POST** /v1/projects/{project_id}/self-hosted/distribution/credentials | Create a Project Self-Hosted Distribution Credential
[**self_hosted_v1_distribution_credentials_delete**](V1Api.md#self_hosted_v1_distribution_credentials_delete) | **DELETE** /v1/projects/{project_id}/self-hosted/distribution/credentials/{distribution_credentials_id} | Delete a Project Self-Hosted Distribution Credential
[**self_hosted_v1_distribution_credentials_get**](V1Api.md#self_hosted_v1_distribution_credentials_get) | **GET** /v1/projects/{project_id}/self-hosted/distribution/credentials/{distribution_credentials_id} | Get a Project Self-Hosted Distribution Credential
[**self_hosted_v1_distribution_credentials_list**](V1Api.md#self_hosted_v1_distribution_credentials_list) | **GET** /v1/projects/{project_id}/self-hosted/distribution/credentials | List Project Self-Hosted Distribution Credentials
[**speak_v1_audio_generate**](V1Api.md#speak_v1_audio_generate) | **POST** /v1/speak | Text to Speech transformation



## agent_v1_settings_think_models_list

> models::AgentThinkModelsV1Response agent_v1_settings_think_models_list()
List Agent Think Models

Retrieves the available think models that can be used for AI agent processing

### Parameters

This endpoint does not need any parameter.

### Return type

[**models::AgentThinkModelsV1Response**](AgentThinkModelsV1Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


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


## listen_v1_media_transcribe

> models::ListenV1MediaTranscribe200Response listen_v1_media_transcribe(listen_v1_request_url, callback, callback_method, extra, sentiment, summarize, tag, topics, custom_topic, custom_topic_mode, intents, custom_intent, custom_intent_mode, detect_entities, detect_language, diarize, dictation, encoding, filler_words, keyterm, keywords, language, measurements, model, multichannel, numerals, paragraphs, profanity_filter, punctuate, redact, replace, search, smart_format, utterances, utt_split, version, mip_opt_out)
Transcribe and analyze pre-recorded audio and video

Transcribe audio and video using Deepgram's speech-to-text REST API

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**listen_v1_request_url** | [**ListenV1RequestUrl**](ListenV1RequestUrl.md) | Transcribe an audio or video file | [required] |
**callback** | Option<**String**> | URL to which we'll make the callback request |  |
**callback_method** | Option<**String**> | HTTP method by which the callback request will be made |  |[default to POST]
**extra** | Option<[**ListenV1MediaTranscribeExtraParameter**](.md)> | Arbitrary key-value pairs that are attached to the API response for usage in downstream processing |  |
**sentiment** | Option<**bool**> | Recognizes the sentiment throughout a transcript or text |  |[default to false]
**summarize** | Option<[**ListenV1MediaTranscribeSummarizeParameter**](.md)> | Summarize content. For Listen API, supports string version option. For Read API, accepts boolean only. |  |
**tag** | Option<[**ListenV1MediaTranscribeExtraParameter**](.md)> | Label your requests for the purpose of identification during usage reporting |  |
**topics** | Option<**bool**> | Detect topics throughout a transcript or text |  |[default to false]
**custom_topic** | Option<[**ListenV1MediaTranscribeCustomTopicParameter**](.md)> | Custom topics you want the model to detect within your input audio or text if present Submit up to `100`. |  |
**custom_topic_mode** | Option<**String**> | Sets how the model will interpret strings submitted to the `custom_topic` param. When `strict`, the model will only return topics submitted using the `custom_topic` param. When `extended`, the model will return its own detected topics in addition to those submitted using the `custom_topic` param |  |[default to extended]
**intents** | Option<**bool**> | Recognizes speaker intent throughout a transcript or text |  |[default to false]
**custom_intent** | Option<[**ListenV1MediaTranscribeCustomIntentParameter**](.md)> | Custom intents you want the model to detect within your input audio if present |  |
**custom_intent_mode** | Option<**String**> | Sets how the model will interpret intents submitted to the `custom_intent` param. When `strict`, the model will only return intents submitted using the `custom_intent` param. When `extended`, the model will return its own detected intents in the `custom_intent` param. |  |[default to extended]
**detect_entities** | Option<**bool**> | Identifies and extracts key entities from content in submitted audio |  |[default to false]
**detect_language** | Option<[**ListenV1MediaTranscribeDetectLanguageParameter**](.md)> | Identifies the dominant language spoken in submitted audio |  |
**diarize** | Option<**bool**> | Recognize speaker changes. Each word in the transcript will be assigned a speaker number starting at 0 |  |[default to false]
**dictation** | Option<**bool**> | Dictation mode for controlling formatting with dictated speech |  |[default to false]
**encoding** | Option<**String**> | Specify the expected encoding of your submitted audio |  |
**filler_words** | Option<**bool**> | Filler Words can help transcribe interruptions in your audio, like \"uh\" and \"um\" |  |[default to false]
**keyterm** | Option<[**Vec<String>**](String.md)> | Key term prompting can boost or suppress specialized terminology and brands. Only compatible with Nova-3 |  |
**keywords** | Option<[**ListenV1MediaTranscribeExtraParameter**](.md)> | Keywords can boost or suppress specialized terminology and brands |  |
**language** | Option<**String**> | The [BCP-47 language tag](https://tools.ietf.org/html/bcp47) that hints at the primary spoken language. Depending on the Model and API endpoint you choose only certain languages are available |  |[default to en]
**measurements** | Option<**bool**> | Spoken measurements will be converted to their corresponding abbreviations |  |[default to false]
**model** | Option<[**ListenV1MediaTranscribeModelParameter**](.md)> | AI model used to process submitted audio |  |[default to base-general]
**multichannel** | Option<**bool**> | Transcribe each audio channel independently |  |[default to false]
**numerals** | Option<**bool**> | Numerals converts numbers from written format to numerical format |  |[default to false]
**paragraphs** | Option<**bool**> | Splits audio into paragraphs to improve transcript readability |  |[default to false]
**profanity_filter** | Option<**bool**> | Profanity Filter looks for recognized profanity and converts it to the nearest recognized non-profane word or removes it from the transcript completely |  |[default to false]
**punctuate** | Option<**bool**> | Add punctuation and capitalization to the transcript |  |[default to false]
**redact** | Option<[**ListenV1MediaTranscribeRedactParameter**](.md)> | Redaction removes sensitive information from your transcripts |  |[default to false]
**replace** | Option<[**ListenV1MediaTranscribeExtraParameter**](.md)> | Search for terms or phrases in submitted audio and replaces them |  |
**search** | Option<[**ListenV1MediaTranscribeExtraParameter**](.md)> | Search for terms or phrases in submitted audio |  |
**smart_format** | Option<**bool**> | Apply formatting to transcript output. When set to true, additional formatting will be applied to transcripts to improve readability |  |[default to false]
**utterances** | Option<**bool**> | Segments speech into meaningful semantic units |  |[default to false]
**utt_split** | Option<**f64**> | Seconds to wait before detecting a pause between words in submitted audio |  |[default to 0.8]
**version** | Option<[**ListenV1MediaTranscribeVersionParameter**](.md)> | Version of an AI model to use |  |[default to latest]
**mip_opt_out** | Option<**bool**> | Opts out requests from the Deepgram Model Improvement Program. Refer to our Docs for pricing impacts before setting this to true. https://dpgr.am/deepgram-mip |  |[default to false]

### Return type

[**models::ListenV1MediaTranscribe200Response**](listen_v1_media_transcribe_200_response.md)

### Authorization

[JwtAuth](../README.md#JwtAuth), [ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json, application/octet-stream
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


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


## read_v1_text_analyze

> models::ReadV1Response read_v1_text_analyze(callback, callback_method, sentiment, summarize, tag, topics, custom_topic, custom_topic_mode, intents, custom_intent, custom_intent_mode, language, read_v1_request)
Analyze text content

Analyze text content using Deepgrams text analysis API

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**callback** | Option<**String**> | URL to which we'll make the callback request |  |
**callback_method** | Option<**String**> | HTTP method by which the callback request will be made |  |[default to POST]
**sentiment** | Option<**bool**> | Recognizes the sentiment throughout a transcript or text |  |[default to false]
**summarize** | Option<[**ListenV1MediaTranscribeSummarizeParameter**](.md)> | Summarize content. For Listen API, supports string version option. For Read API, accepts boolean only. |  |
**tag** | Option<[**ListenV1MediaTranscribeExtraParameter**](.md)> | Label your requests for the purpose of identification during usage reporting |  |
**topics** | Option<**bool**> | Detect topics throughout a transcript or text |  |[default to false]
**custom_topic** | Option<[**ListenV1MediaTranscribeCustomTopicParameter**](.md)> | Custom topics you want the model to detect within your input audio or text if present Submit up to `100`. |  |
**custom_topic_mode** | Option<**String**> | Sets how the model will interpret strings submitted to the `custom_topic` param. When `strict`, the model will only return topics submitted using the `custom_topic` param. When `extended`, the model will return its own detected topics in addition to those submitted using the `custom_topic` param |  |[default to extended]
**intents** | Option<**bool**> | Recognizes speaker intent throughout a transcript or text |  |[default to false]
**custom_intent** | Option<[**ListenV1MediaTranscribeCustomIntentParameter**](.md)> | Custom intents you want the model to detect within your input audio if present |  |
**custom_intent_mode** | Option<**String**> | Sets how the model will interpret intents submitted to the `custom_intent` param. When `strict`, the model will only return intents submitted using the `custom_intent` param. When `extended`, the model will return its own detected intents in the `custom_intent` param. |  |[default to extended]
**language** | Option<**String**> | The [BCP-47 language tag](https://tools.ietf.org/html/bcp47) that hints at the primary spoken language. Depending on the Model and API endpoint you choose only certain languages are available |  |[default to en]
**read_v1_request** | Option<[**ReadV1Request**](ReadV1Request.md)> | Analyze a text file |  |

### Return type

[**models::ReadV1Response**](ReadV1Response.md)

### Authorization

[JwtAuth](../README.md#JwtAuth), [ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## self_hosted_v1_distribution_credentials_create

> models::CreateProjectDistributionCredentialsV1Response self_hosted_v1_distribution_credentials_create(project_id, scopes, provider, create_project_distribution_credentials_v1_request)
Create a Project Self-Hosted Distribution Credential

Creates a set of distribution credentials for the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**scopes** | Option<[**Vec<String>**](String.md)> | List of permission scopes for the credentials |  |[default to [self-hosted:products]]
**provider** | Option<**String**> | The provider of the distribution service |  |[default to quay]
**create_project_distribution_credentials_v1_request** | Option<[**CreateProjectDistributionCredentialsV1Request**](CreateProjectDistributionCredentialsV1Request.md)> | The set of distribution credentials to create |  |

### Return type

[**models::CreateProjectDistributionCredentialsV1Response**](CreateProjectDistributionCredentialsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## self_hosted_v1_distribution_credentials_delete

> models::GetProjectDistributionCredentialsV1Response self_hosted_v1_distribution_credentials_delete(project_id, distribution_credentials_id)
Delete a Project Self-Hosted Distribution Credential

Deletes a set of distribution credentials for the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**distribution_credentials_id** | **String** | The UUID of the distribution credentials | [required] |

### Return type

[**models::GetProjectDistributionCredentialsV1Response**](GetProjectDistributionCredentialsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## self_hosted_v1_distribution_credentials_get

> models::GetProjectDistributionCredentialsV1Response self_hosted_v1_distribution_credentials_get(project_id, distribution_credentials_id)
Get a Project Self-Hosted Distribution Credential

Returns a set of distribution credentials for the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**distribution_credentials_id** | **String** | The UUID of the distribution credentials | [required] |

### Return type

[**models::GetProjectDistributionCredentialsV1Response**](GetProjectDistributionCredentialsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## self_hosted_v1_distribution_credentials_list

> models::ListProjectDistributionCredentialsV1Response self_hosted_v1_distribution_credentials_list(project_id)
List Project Self-Hosted Distribution Credentials

Lists sets of distribution credentials for the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |

### Return type

[**models::ListProjectDistributionCredentialsV1Response**](ListProjectDistributionCredentialsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## speak_v1_audio_generate

> std::path::PathBuf speak_v1_audio_generate(speak_v1_request, callback, callback_method, mip_opt_out, tag, bit_rate, container, encoding, model, sample_rate)
Text to Speech transformation

Convert text into natural-sounding speech using Deepgram's TTS REST API

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**speak_v1_request** | [**SpeakV1Request**](SpeakV1Request.md) | Transform text to speech | [required] |
**callback** | Option<**String**> | URL to which we'll make the callback request |  |
**callback_method** | Option<**String**> | HTTP method by which the callback request will be made |  |[default to POST]
**mip_opt_out** | Option<**bool**> | Opts out requests from the Deepgram Model Improvement Program. Refer to our Docs for pricing impacts before setting this to true. https://dpgr.am/deepgram-mip |  |[default to false]
**tag** | Option<[**ListenV1MediaTranscribeExtraParameter**](.md)> | Label your requests for the purpose of identification during usage reporting |  |
**bit_rate** | Option<[**SpeakV1AudioGenerateBitRateParameter**](.md)> | The bitrate of the audio in bits per second. Choose from predefined ranges or specific values based on the encoding type. |  |[default to 48000]
**container** | Option<[**SpeakV1AudioGenerateContainerParameter**](.md)> | Container specifies the file format wrapper for the output audio. The available options depend on the encoding type. |  |[default to wav]
**encoding** | Option<[**SpeakV1AudioGenerateEncodingParameter**](.md)> | Encoding allows you to specify the expected encoding of your audio output |  |[default to mp3]
**model** | Option<**String**> | AI model used to process submitted text |  |[default to aura-asteria-en]
**sample_rate** | Option<[**SpeakV1AudioGenerateSampleRateParameter**](.md)> | Sample Rate specifies the sample rate for the output audio. Based on the encoding, different sample rates are supported. For some encodings, the sample rate is not configurable |  |[default to 24000]

### Return type

[**std::path::PathBuf**](std::path::PathBuf.md)

### Authorization

[JwtAuth](../README.md#JwtAuth), [ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/octet-stream, application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


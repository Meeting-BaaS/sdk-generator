# \UsageApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**manage_v1_projects_usage_breakdown_get**](UsageApi.md#manage_v1_projects_usage_breakdown_get) | **GET** /v1/projects/{project_id}/usage/breakdown | Get Project Usage Breakdown
[**manage_v1_projects_usage_fields_list**](UsageApi.md#manage_v1_projects_usage_fields_list) | **GET** /v1/projects/{project_id}/usage/fields | List Project Usage Fields
[**manage_v1_projects_usage_get**](UsageApi.md#manage_v1_projects_usage_get) | **GET** /v1/projects/{project_id}/usage | Get Project Usage



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


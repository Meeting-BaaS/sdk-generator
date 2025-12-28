# \TextApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**read_v1_text_analyze**](TextApi.md#read_v1_text_analyze) | **POST** /v1/read | Analyze text content



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


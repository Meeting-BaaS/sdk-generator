# \ListenApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**listen_v1_media_transcribe**](ListenApi.md#listen_v1_media_transcribe) | **POST** /v1/listen | Transcribe and analyze pre-recorded audio and video



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


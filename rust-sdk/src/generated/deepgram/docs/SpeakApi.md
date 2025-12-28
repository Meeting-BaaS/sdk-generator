# \SpeakApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**speak_v1_audio_generate**](SpeakApi.md#speak_v1_audio_generate) | **POST** /v1/speak | Text to Speech transformation



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


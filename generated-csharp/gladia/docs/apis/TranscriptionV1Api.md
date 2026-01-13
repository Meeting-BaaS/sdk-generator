# Gladia.SDK.Api.TranscriptionV1Api

All URIs are relative to *https://api.gladia.io*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**AudioToTextControllerAudioTranscription**](TranscriptionV1Api.md#audiototextcontrolleraudiotranscription) | **POST** /audio/text/audio-transcription |  |
| [**VideoToTextControllerVideoTranscription**](TranscriptionV1Api.md#videototextcontrollervideotranscription) | **POST** /video/text/video-transcription |  |

<a id="audiototextcontrolleraudiotranscription"></a>
# **AudioToTextControllerAudioTranscription**
> void AudioToTextControllerAudioTranscription (System.IO.Stream audio = null, string audioUrl = null, string languageBehaviour = null, string language = null, string transcriptionHint = null, bool toggleDiarization = null, int diarizationNumSpeakers = null, int diarizationMinSpeakers = null, int diarizationMaxSpeakers = null, bool toggleDirectTranslate = null, string targetTranslationLanguage = null, string outputFormat = null, bool toggleNoiseReduction = null, bool toggleAccurateWordsTimestamps = null, string webhookUrl = null)




### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **audio** | **System.IO.Stream****System.IO.Stream** |  | [optional]  |
| **audioUrl** | **string** |  | [optional] [default to &quot;http://files.gladia.io/example/audio-transcription/split_infinity.wav&quot;] |
| **languageBehaviour** | **string** |  | [optional] [default to automatic single language] |
| **language** | **string** |  | [optional]  |
| **transcriptionHint** | **string** |  | [optional]  |
| **toggleDiarization** | **bool** |  | [optional] [default to false] |
| **diarizationNumSpeakers** | **int** |  | [optional]  |
| **diarizationMinSpeakers** | **int** |  | [optional]  |
| **diarizationMaxSpeakers** | **int** |  | [optional]  |
| **toggleDirectTranslate** | **bool** |  | [optional] [default to false] |
| **targetTranslationLanguage** | **string** |  | [optional]  |
| **outputFormat** | **string** |  | [optional] [default to json] |
| **toggleNoiseReduction** | **bool** |  | [optional] [default to false] |
| **toggleAccurateWordsTimestamps** | **bool** |  | [optional] [default to false] |
| **webhookUrl** | **string** |  | [optional]  |

### Return type

void (empty response body)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="videototextcontrollervideotranscription"></a>
# **VideoToTextControllerVideoTranscription**
> void VideoToTextControllerVideoTranscription (System.IO.Stream video = null, string videoUrl = null, string languageBehaviour = null, string language = null, string transcriptionHint = null, bool toggleDiarization = null, int diarizationNumSpeakers = null, int diarizationMinSpeakers = null, int diarizationMaxSpeakers = null, bool toggleDirectTranslate = null, string targetTranslationLanguage = null, string outputFormat = null, bool toggleNoiseReduction = null, bool toggleAccurateWordsTimestamps = null, string webhookUrl = null)




### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **video** | **System.IO.Stream****System.IO.Stream** |  | [optional]  |
| **videoUrl** | **string** |  | [optional] [default to &quot;http://files.gladia.io/example/audio-transcription/split_infinity.wav&quot;] |
| **languageBehaviour** | **string** |  | [optional] [default to automatic single language] |
| **language** | **string** |  | [optional]  |
| **transcriptionHint** | **string** |  | [optional]  |
| **toggleDiarization** | **bool** |  | [optional] [default to false] |
| **diarizationNumSpeakers** | **int** |  | [optional]  |
| **diarizationMinSpeakers** | **int** |  | [optional]  |
| **diarizationMaxSpeakers** | **int** |  | [optional]  |
| **toggleDirectTranslate** | **bool** |  | [optional] [default to false] |
| **targetTranslationLanguage** | **string** |  | [optional]  |
| **outputFormat** | **string** |  | [optional] [default to json] |
| **toggleNoiseReduction** | **bool** |  | [optional] [default to false] |
| **toggleAccurateWordsTimestamps** | **bool** |  | [optional] [default to false] |
| **webhookUrl** | **string** |  | [optional]  |

### Return type

void (empty response body)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)


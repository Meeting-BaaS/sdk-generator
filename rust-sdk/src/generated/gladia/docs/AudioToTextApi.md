# \AudioToTextApi

All URIs are relative to *https://api.gladia.io*

Method | HTTP request | Description
------------- | ------------- | -------------
[**audio_to_text_controller_audio_transcription**](AudioToTextApi.md#audio_to_text_controller_audio_transcription) | **POST** /audio/text/audio-transcription | 



## audio_to_text_controller_audio_transcription

> audio_to_text_controller_audio_transcription(audio, audio_url, language_behaviour, language, transcription_hint, toggle_diarization, diarization_num_speakers, diarization_min_speakers, diarization_max_speakers, toggle_direct_translate, target_translation_language, output_format, toggle_noise_reduction, toggle_accurate_words_timestamps, webhook_url)


### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**audio** | Option<**std::path::PathBuf**> |  |  |
**audio_url** | Option<**String**> |  |  |[default to http://files.gladia.io/example/audio-transcription/split_infinity.wav]
**language_behaviour** | Option<**String**> |  |  |[default to automatic single language]
**language** | Option<**String**> |  |  |
**transcription_hint** | Option<**String**> |  |  |
**toggle_diarization** | Option<**bool**> |  |  |[default to false]
**diarization_num_speakers** | Option<**i32**> |  |  |
**diarization_min_speakers** | Option<**i32**> |  |  |
**diarization_max_speakers** | Option<**i32**> |  |  |
**toggle_direct_translate** | Option<**bool**> |  |  |[default to false]
**target_translation_language** | Option<**String**> |  |  |
**output_format** | Option<**String**> |  |  |[default to json]
**toggle_noise_reduction** | Option<**bool**> |  |  |[default to false]
**toggle_accurate_words_timestamps** | Option<**bool**> |  |  |[default to false]
**webhook_url** | Option<**String**> |  |  |

### Return type

 (empty response body)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: multipart/form-data
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


# TranscriptOptionalParamsLanguageDetectionOptions

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**expected_languages** | Option<[**Vec<serde_json::Value>**](serde_json::Value.md)> | List of languages expected in the audio file. Defaults to `[\"all\"]` when unspecified. | [optional]
**fallback_language** | Option<**String**> | If the detected language of the audio file is not in the list of expected languages, the `fallback_language` is used. Specify `[\"auto\"]` to let our model choose the fallback language from `expected_languages` with the highest confidence score.  | [optional][default to auto]
**code_switching** | Option<**bool**> | Whether code switching should be detected.  | [optional][default to false]
**code_switching_confidence_threshold** | Option<**f64**> | The confidence threshold for code switching detection. If the code switching confidence is below this threshold, the transcript will be processed in the language with the highest `language_detection_confidence` score.  | [optional][default to 0.3]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



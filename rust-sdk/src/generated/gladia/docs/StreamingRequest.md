# StreamingRequest

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**encoding** | Option<[**models::StreamingSupportedEncodingEnum**](StreamingSupportedEncodingEnum.md)> | The encoding format of the audio stream. Supported formats:  - PCM: 8, 16, 24, and 32 bits  - A-law: 8 bits  - μ-law: 8 bits   Note: No need to add WAV headers to raw audio as the API supports both formats. | [optional][default to WavSlashPcm]
**bit_depth** | Option<[**models::StreamingSupportedBitDepthEnum**](StreamingSupportedBitDepthEnum.md)> | The bit depth of the audio stream | [optional][default to Variant16]
**sample_rate** | Option<[**models::StreamingSupportedSampleRateEnum**](StreamingSupportedSampleRateEnum.md)> | The sample rate of the audio stream | [optional][default to Variant16000]
**channels** | Option<**i32**> | The number of channels of the audio stream | [optional][default to 1]
**custom_metadata** | Option<[**std::collections::HashMap<String, serde_json::Value>**](serde_json::Value.md)> | Custom metadata you can attach to this live transcription | [optional]
**model** | Option<[**models::StreamingSupportedModels**](StreamingSupportedModels.md)> | The model used to process the audio. \"solaria-1\" is used by default. | [optional][default to Solaria1]
**endpointing** | Option<**f64**> | The endpointing duration in seconds. Endpointing is the duration of silence which will cause an utterance to be considered as finished | [optional][default to 0.05]
**maximum_duration_without_endpointing** | Option<**f64**> | The maximum duration in seconds without endpointing. If endpointing is not detected after this duration, current utterance will be considered as finished | [optional][default to 5]
**language_config** | Option<[**models::LanguageConfig**](LanguageConfig.md)> | Specify the language configuration | [optional]
**pre_processing** | Option<[**models::PreProcessingConfig**](PreProcessingConfig.md)> | Specify the pre-processing configuration | [optional]
**realtime_processing** | Option<[**models::RealtimeProcessingConfig**](RealtimeProcessingConfig.md)> | Specify the realtime processing configuration | [optional]
**post_processing** | Option<[**models::PostProcessingConfig**](PostProcessingConfig.md)> | Specify the post-processing configuration | [optional]
**messages_config** | Option<[**models::MessagesConfig**](MessagesConfig.md)> | Specify the websocket messages configuration | [optional]
**callback** | Option<**bool**> | If true, messages will be sent to configured url. | [optional][default to false]
**callback_config** | Option<[**models::CallbackConfig**](CallbackConfig.md)> | Specify the callback configuration | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



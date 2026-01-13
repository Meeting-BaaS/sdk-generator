# Gladia.SDK.Model.StreamingRequestParamsResponse

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Encoding** | **StreamingSupportedEncodingEnum** | The encoding format of the audio stream. Supported formats:  - PCM: 8, 16, 24, and 32 bits  - A-law: 8 bits  - μ-law: 8 bits   Note: No need to add WAV headers to raw audio as the API supports both formats. | [optional] 
**BitDepth** | **StreamingSupportedBitDepthEnum** | The bit depth of the audio stream | [optional] 
**SampleRate** | **StreamingSupportedSampleRateEnum** | The sample rate of the audio stream | [optional] 
**Channels** | **int** | The number of channels of the audio stream | [optional] [default to 1]
**Model** | **StreamingSupportedModels** | The model used to process the audio. \&quot;solaria-1\&quot; is used by default. | [optional] 
**Endpointing** | **decimal** | The endpointing duration in seconds. Endpointing is the duration of silence which will cause an utterance to be considered as finished | [optional] [default to 0.05M]
**MaximumDurationWithoutEndpointing** | **decimal** | The maximum duration in seconds without endpointing. If endpointing is not detected after this duration, current utterance will be considered as finished | [optional] [default to 5M]
**LanguageConfig** | [**LanguageConfig**](LanguageConfig.md) | Specify the language configuration | [optional] 
**PreProcessing** | [**PreProcessingConfig**](PreProcessingConfig.md) | Specify the pre-processing configuration | [optional] 
**RealtimeProcessing** | [**RealtimeProcessingConfig**](RealtimeProcessingConfig.md) | Specify the realtime processing configuration | [optional] 
**PostProcessing** | [**PostProcessingConfig**](PostProcessingConfig.md) | Specify the post-processing configuration | [optional] 
**MessagesConfig** | [**MessagesConfig**](MessagesConfig.md) | Specify the websocket messages configuration | [optional] 
**Callback** | **bool** | If true, messages will be sent to configured url. | [optional] [default to false]
**CallbackConfig** | [**CallbackConfig**](CallbackConfig.md) | Specify the callback configuration | [optional] 

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


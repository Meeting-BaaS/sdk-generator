# LemurTaskParams

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**prompt** | **String** | Your text to prompt the model to produce a desired output, including any context you want to pass into the model. | 
**transcript_ids** | Option<[**Vec<uuid::Uuid>**](uuid::Uuid.md)> | A list of completed transcripts with text. Up to a maximum of 100 hours of audio. Use either transcript_ids or input_text as input into LeMUR.  | [optional]
**input_text** | Option<**String**> | Custom formatted transcript data. Maximum size is the context limit of the selected model. Use either transcript_ids or input_text as input into LeMUR.  | [optional]
**final_model** | [**models::LemurModel**](LemurModel.md) |  | 
**max_output_size** | Option<**i32**> | Maximum output size in tokens, up to the `final_model`'s max [(see chart)](/docs/lemur/customize-parameters#change-the-maximum-output-size). | [optional][default to 2000]
**temperature** | Option<**f32**> | The temperature to use for the model. Higher values result in answers that are more creative, lower values are more conservative. Can be any value between 0.0 and 1.0 inclusive.  | [optional][default to 0]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



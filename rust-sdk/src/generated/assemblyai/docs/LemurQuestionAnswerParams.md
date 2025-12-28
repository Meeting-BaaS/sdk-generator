# LemurQuestionAnswerParams

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**transcript_ids** | Option<[**Vec<uuid::Uuid>**](uuid::Uuid.md)> | A list of completed transcripts with text. Up to a maximum of 100 hours of audio. Use either transcript_ids or input_text as input into LeMUR.  | [optional]
**input_text** | Option<**String**> | Custom formatted transcript data. Maximum size is the context limit of the selected model. Use either transcript_ids or input_text as input into LeMUR.  | [optional]
**context** | Option<[**models::LemurBaseParamsContext**](LemurBaseParams_context.md)> |  | [optional]
**final_model** | [**models::LemurBaseParamsFinalModel**](LemurBaseParams_final_model.md) |  | 
**max_output_size** | Option<**i32**> | Maximum output size in tokens, up to the `final_model`'s max [(see chart)](/docs/lemur/customize-parameters#change-the-maximum-output-size). | [optional][default to 2000]
**temperature** | Option<**f32**> | The temperature to use for the model. Higher values result in answers that are more creative, lower values are more conservative. Can be any value between 0.0 and 1.0 inclusive.  | [optional][default to 0]
**questions** | [**Vec<models::LemurQuestion>**](LemurQuestion.md) | A list of questions to ask | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



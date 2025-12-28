# LemurQuestion

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**question** | **String** | The question you wish to ask. For more complex questions use default model. | 
**context** | Option<[**models::LemurQuestionContext**](LemurQuestion_context.md)> |  | [optional]
**answer_format** | Option<**String**> | How you want the answer to be returned. This can be any text. Can't be used with answer_options. Examples: \"short sentence\", \"bullet points\"  | [optional]
**answer_options** | Option<**Vec<String>**> | What discrete options to return. Useful for precise responses. Can't be used with answer_format. Example: [\"Yes\", \"No\"]  | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



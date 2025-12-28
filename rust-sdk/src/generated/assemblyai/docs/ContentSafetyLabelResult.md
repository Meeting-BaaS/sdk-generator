# ContentSafetyLabelResult

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**text** | **String** | The transcript of the section flagged by the Content Moderation model | 
**labels** | [**Vec<models::ContentSafetyLabel>**](ContentSafetyLabel.md) | An array of safety labels, one per sensitive topic that was detected in the section | 
**sentences_idx_start** | **i32** | The sentence index at which the section begins | 
**sentences_idx_end** | **i32** | The sentence index at which the section ends | 
**timestamp** | [**models::Timestamp**](Timestamp.md) | Timestamp information for the section | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



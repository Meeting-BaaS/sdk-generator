# TopicDetectionModelResult

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | [**models::AudioIntelligenceModelStatus**](AudioIntelligenceModelStatus.md) | The status of the Topic Detection model. Either success, or unavailable in the rare case that the model failed. | 
**results** | [**Vec<models::TopicDetectionResult>**](TopicDetectionResult.md) | An array of results for the Topic Detection model | 
**summary** | **std::collections::HashMap<String, f64>** | The overall relevance of topic to the entire audio file | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



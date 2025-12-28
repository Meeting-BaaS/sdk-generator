# ContentSafetyLabelsResult

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | [**models::AudioIntelligenceModelStatus**](AudioIntelligenceModelStatus.md) | The status of the Content Moderation model. Either success, or unavailable in the rare case that the model failed. | 
**results** | [**Vec<models::ContentSafetyLabelResult>**](ContentSafetyLabelResult.md) | An array of results for the Content Moderation model | 
**summary** | **std::collections::HashMap<String, f64>** | A summary of the Content Moderation confidence results for the entire audio file | 
**severity_score_summary** | [**std::collections::HashMap<String, models::SeverityScoreSummary>**](SeverityScoreSummary.md) | A summary of the Content Moderation severity results for the entire audio file | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



# WordSearchResponse

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | [**uuid::Uuid**](uuid::Uuid.md) | The ID of the transcript | 
**total_count** | **i32** | The total count of all matched instances. For e.g., word 1 matched 2 times, and word 2 matched 3 times, `total_count` will equal 5. | 
**matches** | [**Vec<models::WordSearchMatch>**](WordSearchMatch.md) | The matches of the search | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



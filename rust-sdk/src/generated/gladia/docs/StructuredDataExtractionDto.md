# StructuredDataExtractionDto

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**success** | **bool** | The audio intelligence model succeeded to get a valid output | 
**is_empty** | **bool** | The audio intelligence model returned an empty value | 
**exec_time** | **f64** | Time audio intelligence model took to complete the task | 
**error** | [**models::AddonErrorDto**](AddonErrorDTO.md) | `null` if `success` is `true`. Contains the error details of the failed model | 
**results** | **String** | If `structured_data_extraction` has been enabled, results of the AI structured data extraction for the defined classes. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



# DisplayModeDto

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**success** | **bool** | The audio intelligence model succeeded to get a valid output | 
**is_empty** | **bool** | The audio intelligence model returned an empty value | 
**exec_time** | **f64** | Time audio intelligence model took to complete the task | 
**error** | [**models::AddonErrorDto**](AddonErrorDTO.md) | `null` if `success` is `true`. Contains the error details of the failed model | 
**results** | **Vec<String>** | If `display_mode` has been enabled, proposes an alternative display output. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



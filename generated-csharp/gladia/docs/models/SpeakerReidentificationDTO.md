# Gladia.SDK.Model.SpeakerReidentificationDTO

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Success** | **bool** | The audio intelligence model succeeded to get a valid output | 
**IsEmpty** | **bool** | The audio intelligence model returned an empty value | 
**ExecTime** | **decimal** | Time audio intelligence model took to complete the task | 
**Error** | [**AddonErrorDTO**](AddonErrorDTO.md) | &#x60;null&#x60; if &#x60;success&#x60; is &#x60;true&#x60;. Contains the error details of the failed model | 
**Results** | **string** | If &#x60;speaker_reidentification&#x60; has been enabled, results of the AI speaker reidentification. | 

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


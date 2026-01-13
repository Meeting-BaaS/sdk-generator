# Gladia.SDK.Model.ChapterizationDTO

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Success** | **bool** | The audio intelligence model succeeded to get a valid output | 
**IsEmpty** | **bool** | The audio intelligence model returned an empty value | 
**ExecTime** | **decimal** | Time audio intelligence model took to complete the task | 
**Error** | [**AddonErrorDTO**](AddonErrorDTO.md) | &#x60;null&#x60; if &#x60;success&#x60; is &#x60;true&#x60;. Contains the error details of the failed model | 
**Results** | **Dictionary&lt;string, Object&gt;** | If &#x60;chapterization&#x60; has been enabled, will generate chapters name for different parts of the given audio. | 

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


# SubtitlesConfigDto

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**formats** | Option<[**Vec<models::SubtitlesFormatEnum>**](SubtitlesFormatEnum.md)> | Subtitles formats you want your transcription to be formatted to | [optional][default to [srt]]
**minimum_duration** | Option<**f64**> | Minimum duration of a subtitle in seconds | [optional]
**maximum_duration** | Option<**f64**> | Maximum duration of a subtitle in seconds | [optional]
**maximum_characters_per_row** | Option<**i32**> | Maximum number of characters per row in a subtitle | [optional]
**maximum_rows_per_caption** | Option<**i32**> | Maximum number of rows per caption | [optional]
**style** | Option<[**models::SubtitlesStyleEnum**](SubtitlesStyleEnum.md)> | Style of the subtitles. Compliance mode refers to : https://loc.gov/preservation/digital/formats//fdd/fdd000569.shtml#:~:text=SRT%20files%20are%20basic%20text,alongside%2C%20example%3A%20%22MyVideo123  | [optional][default to Default]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



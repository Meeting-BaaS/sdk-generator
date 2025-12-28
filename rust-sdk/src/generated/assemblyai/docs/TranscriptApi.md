# \TranscriptApi

All URIs are relative to *https://api.assemblyai.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_transcript**](TranscriptApi.md#create_transcript) | **POST** /v2/transcript | Transcribe audio
[**delete_transcript**](TranscriptApi.md#delete_transcript) | **DELETE** /v2/transcript/{transcript_id} | Delete transcript
[**get_redacted_audio**](TranscriptApi.md#get_redacted_audio) | **GET** /v2/transcript/{transcript_id}/redacted-audio | Get redacted audio
[**get_subtitles**](TranscriptApi.md#get_subtitles) | **GET** /v2/transcript/{transcript_id}/{subtitle_format} | Get subtitles for transcript
[**get_transcript**](TranscriptApi.md#get_transcript) | **GET** /v2/transcript/{transcript_id} | Get transcript
[**get_transcript_paragraphs**](TranscriptApi.md#get_transcript_paragraphs) | **GET** /v2/transcript/{transcript_id}/paragraphs | Get paragraphs in transcript
[**get_transcript_sentences**](TranscriptApi.md#get_transcript_sentences) | **GET** /v2/transcript/{transcript_id}/sentences | Get sentences in transcript
[**list_transcripts**](TranscriptApi.md#list_transcripts) | **GET** /v2/transcript | List transcripts
[**upload_file**](TranscriptApi.md#upload_file) | **POST** /v2/upload | Upload a media file
[**word_search**](TranscriptApi.md#word_search) | **GET** /v2/transcript/{transcript_id}/word-search | Search words in transcript



## create_transcript

> models::Transcript create_transcript(transcript_params)
Transcribe audio

<Note>To use our EU server for transcription, replace `api.assemblyai.com` with `api.eu.assemblyai.com`.</Note> Create a transcript from a media file that is accessible via a URL. 

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**transcript_params** | [**TranscriptParams**](TranscriptParams.md) | Params to create a transcript | [required] |

### Return type

[**models::Transcript**](Transcript.md)

### Authorization

[ApiKey](../README.md#ApiKey)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## delete_transcript

> models::Transcript delete_transcript(transcript_id)
Delete transcript

<Note>To delete your transcriptions on our EU server, replace `api.assemblyai.com` with `api.eu.assemblyai.com`.</Note> Remove the data from the transcript and mark it as deleted. <Warning>Files uploaded via the `/upload` endpoint are immediately deleted alongside the transcript when you make a DELETE request, ensuring your data is removed from our systems right away.</Warning> 

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**transcript_id** | **String** | ID of the transcript | [required] |

### Return type

[**models::Transcript**](Transcript.md)

### Authorization

[ApiKey](../README.md#ApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## get_redacted_audio

> models::RedactedAudioResponse get_redacted_audio(transcript_id)
Get redacted audio

<Note>To retrieve the redacted audio on the EU server, replace `api.assemblyai.com` with `api.eu.assemblyai.com` in the `GET` request above.</Note> Retrieve the redacted audio object containing the status and URL to the redacted audio. 

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**transcript_id** | **String** | ID of the transcript | [required] |

### Return type

[**models::RedactedAudioResponse**](RedactedAudioResponse.md)

### Authorization

[ApiKey](../README.md#ApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## get_subtitles

> String get_subtitles(transcript_id, subtitle_format, chars_per_caption)
Get subtitles for transcript

<Note>To retrieve your transcriptions on our EU server, replace `api.assemblyai.com` with `api.eu.assemblyai.com`.</Note> Export your transcript in SRT or VTT format to use with a video player for subtitles and closed captions. 

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**transcript_id** | **String** | ID of the transcript | [required] |
**subtitle_format** | [**SubtitleFormat**](.md) | The format of the captions | [required] |
**chars_per_caption** | Option<**i32**> | The maximum number of characters per caption |  |

### Return type

**String**

### Authorization

[ApiKey](../README.md#ApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## get_transcript

> models::Transcript get_transcript(transcript_id)
Get transcript

<Note>To retrieve your transcriptions on our EU server, replace `api.assemblyai.com` with `api.eu.assemblyai.com`.</Note> Get the transcript resource. The transcript is ready when the \"status\" is \"completed\". 

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**transcript_id** | **String** | ID of the transcript | [required] |

### Return type

[**models::Transcript**](Transcript.md)

### Authorization

[ApiKey](../README.md#ApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## get_transcript_paragraphs

> models::ParagraphsResponse get_transcript_paragraphs(transcript_id)
Get paragraphs in transcript

<Note>To retrieve your transcriptions on our EU server, replace `api.assemblyai.com` with `api.eu.assemblyai.com`.</Note> Get the transcript split by paragraphs. The API will attempt to semantically segment your transcript into paragraphs to create more reader-friendly transcripts. 

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**transcript_id** | **String** | ID of the transcript | [required] |

### Return type

[**models::ParagraphsResponse**](ParagraphsResponse.md)

### Authorization

[ApiKey](../README.md#ApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## get_transcript_sentences

> models::SentencesResponse get_transcript_sentences(transcript_id)
Get sentences in transcript

<Note>To retrieve your transcriptions on our EU server, replace `api.assemblyai.com` with `api.eu.assemblyai.com`.</Note> Get the transcript split by sentences. The API will attempt to semantically segment the transcript into sentences to create more reader-friendly transcripts. 

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**transcript_id** | **String** | ID of the transcript | [required] |

### Return type

[**models::SentencesResponse**](SentencesResponse.md)

### Authorization

[ApiKey](../README.md#ApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## list_transcripts

> models::TranscriptList list_transcripts(limit, status, created_on, before_id, after_id, throttled_only)
List transcripts

<Note>To retrieve your transcriptions on our EU server, replace `api.assemblyai.com` with `api.eu.assemblyai.com`.</Note> Retrieve a list of transcripts you created. Transcripts are sorted from newest to oldest and can be retrieved for the last 90 days of usage. The previous URL always points to a page with older transcripts.  If you need to retrieve transcripts from more than 90 days ago please reach out to our Support team at support@assemblyai.com. 

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**limit** | Option<**i32**> | Maximum amount of transcripts to retrieve |  |[default to 10]
**status** | Option<[**TranscriptStatus**](.md)> | Filter by transcript status |  |
**created_on** | Option<**String**> | Only get transcripts created on this date |  |
**before_id** | Option<**uuid::Uuid**> | Get transcripts that were created before this transcript ID |  |
**after_id** | Option<**uuid::Uuid**> | Get transcripts that were created after this transcript ID |  |
**throttled_only** | Option<**bool**> | Only get throttled transcripts, overrides the status filter |  |[default to false]

### Return type

[**models::TranscriptList**](TranscriptList.md)

### Authorization

[ApiKey](../README.md#ApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## upload_file

> models::UploadedFile upload_file(body)
Upload a media file

Upload a media file to AssemblyAI's servers.  <Note>To upload a media file to our EU server, replace `api.assemblyai.com` with `api.eu.assemblyai.com`.</Note> <Warning>Requests to transcribe uploaded files must use an API key from the same project as the key that was used to upload the file. If you use an API key from a different project you will get a `403` error and \"Cannot access uploaded file\" message.</Warning> 

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**body** | Option<**std::path::PathBuf**> |  |  |

### Return type

[**models::UploadedFile**](UploadedFile.md)

### Authorization

[ApiKey](../README.md#ApiKey)

### HTTP request headers

- **Content-Type**: application/octet-stream
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## word_search

> models::WordSearchResponse word_search(transcript_id, words)
Search words in transcript

<Note>To search through a transcription created on our EU server, replace `api.assemblyai.com` with `api.eu.assemblyai.com`.</Note> Search through the transcript for keywords. You can search for individual words, numbers, or phrases containing up to five words or numbers. 

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**transcript_id** | **String** | ID of the transcript | [required] |
**words** | [**Vec<String>**](String.md) | Keywords to search for | [required] |

### Return type

[**models::WordSearchResponse**](WordSearchResponse.md)

### Authorization

[ApiKey](../README.md#ApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


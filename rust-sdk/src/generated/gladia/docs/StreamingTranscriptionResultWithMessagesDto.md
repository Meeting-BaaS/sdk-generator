# StreamingTranscriptionResultWithMessagesDto

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**metadata** | [**models::TranscriptionMetadataDto**](TranscriptionMetadataDTO.md) | Metadata for the given transcription & audio file | 
**transcription** | Option<[**models::TranscriptionDto**](TranscriptionDTO.md)> | Transcription of the audio speech | [optional]
**translation** | Option<[**models::TranslationDto**](TranslationDTO.md)> | If `translation` has been enabled, translation of the audio speech transcription | [optional]
**summarization** | Option<[**models::SummarizationDto**](SummarizationDTO.md)> | If `summarization` has been enabled, summarization of the audio speech transcription | [optional]
**named_entity_recognition** | Option<[**models::NamedEntityRecognitionDto**](NamedEntityRecognitionDTO.md)> | If `named_entity_recognition` has been enabled, the detected entities | [optional]
**sentiment_analysis** | Option<[**models::SentimentAnalysisDto**](SentimentAnalysisDTO.md)> | If `sentiment_analysis` has been enabled, sentiment analysis of the audio speech transcription | [optional]
**chapterization** | Option<[**models::ChapterizationDto**](ChapterizationDTO.md)> | If `chapterization` has been enabled, will generate chapters name for different parts of the given audio. | [optional]
**messages** | Option<**Vec<String>**> | Real-Time messages sent by the server during the live transcription | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



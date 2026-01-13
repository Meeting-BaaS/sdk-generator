# Gladia.SDK.Model.StreamingTranscriptionResultDTO

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Metadata** | [**TranscriptionMetadataDTO**](TranscriptionMetadataDTO.md) | Metadata for the given transcription &amp; audio file | 
**Transcription** | [**TranscriptionDTO**](TranscriptionDTO.md) | Transcription of the audio speech | [optional] 
**Translation** | [**TranslationDTO**](TranslationDTO.md) | If &#x60;translation&#x60; has been enabled, translation of the audio speech transcription | [optional] 
**Summarization** | [**SummarizationDTO**](SummarizationDTO.md) | If &#x60;summarization&#x60; has been enabled, summarization of the audio speech transcription | [optional] 
**NamedEntityRecognition** | [**NamedEntityRecognitionDTO**](NamedEntityRecognitionDTO.md) | If &#x60;named_entity_recognition&#x60; has been enabled, the detected entities | [optional] 
**SentimentAnalysis** | [**SentimentAnalysisDTO**](SentimentAnalysisDTO.md) | If &#x60;sentiment_analysis&#x60; has been enabled, sentiment analysis of the audio speech transcription | [optional] 
**Chapterization** | [**ChapterizationDTO**](ChapterizationDTO.md) | If &#x60;chapterization&#x60; has been enabled, will generate chapters name for different parts of the given audio. | [optional] 

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


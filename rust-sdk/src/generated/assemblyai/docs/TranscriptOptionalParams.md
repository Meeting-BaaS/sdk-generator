# TranscriptOptionalParams

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**language_code** | Option<[**models::TranscriptOptionalParamsLanguageCode**](TranscriptOptionalParams_language_code.md)> |  | [optional]
**language_codes** | Option<[**Vec<models::TranscriptLanguageCode>**](TranscriptLanguageCode.md)> | The language codes of your audio file. Used for [Code switching](/docs/speech-to-text/pre-recorded-audio/code-switching) One of the values specified must be `en`.  | [optional]
**language_detection** | Option<**bool**> | Enable [Automatic language detection](https://www.assemblyai.com/docs/models/speech-recognition#automatic-language-detection), either true or false. | [optional][default to false]
**language_detection_options** | Option<[**models::TranscriptOptionalParamsLanguageDetectionOptions**](TranscriptOptionalParams_language_detection_options.md)> |  | [optional]
**language_confidence_threshold** | Option<**f32**> | The confidence threshold for the automatically detected language. An error will be returned if the language confidence is below this threshold. Defaults to 0.  | [optional][default to 0]
**speech_model** | Option<[**models::SpeechModel**](SpeechModel.md)> |  | [optional]
**speech_models** | Option<[**Vec<models::SpeechModel>**](SpeechModel.md)> | List multiple speech models in priority order, allowing our system to automatically route your audio to the best available option.  | [optional]
**punctuate** | Option<**bool**> | Enable Automatic Punctuation, can be true or false | [optional][default to true]
**format_text** | Option<**bool**> | Enable Text Formatting, can be true or false | [optional][default to true]
**disfluencies** | Option<**bool**> | Transcribe Filler Words, like \"umm\", in your media file; can be true or false | [optional][default to false]
**multichannel** | Option<**bool**> | Enable [Multichannel](https://www.assemblyai.com/docs/models/speech-recognition#multichannel-transcription) transcription, can be true or false. | [optional][default to false]
**webhook_url** | Option<**String**> | The URL to which we send webhook requests. We sends two different types of webhook requests. One request when a transcript is completed or failed, and one request when the redacted audio is ready if redact_pii_audio is enabled.  | [optional]
**webhook_auth_header_name** | Option<**String**> | The header name to be sent with the transcript completed or failed webhook requests | [optional]
**webhook_auth_header_value** | Option<**String**> | The header value to send back with the transcript completed or failed webhook requests for added security | [optional]
**auto_highlights** | Option<**bool**> | Enable Key Phrases, either true or false | [optional][default to false]
**audio_start_from** | Option<**i32**> | The point in time, in milliseconds, to begin transcribing in your media file | [optional]
**audio_end_at** | Option<**i32**> | The point in time, in milliseconds, to stop transcribing in your media file | [optional]
**filter_profanity** | Option<**bool**> | Filter profanity from the transcribed text, can be true or false | [optional][default to false]
**redact_pii** | Option<**bool**> | Redact PII from the transcribed text using the Redact PII model, can be true or false | [optional][default to false]
**redact_pii_audio** | Option<**bool**> | Generate a copy of the original media file with spoken PII \"beeped\" out, can be true or false. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details. | [optional][default to false]
**redact_pii_audio_quality** | Option<[**models::RedactPiiAudioQuality**](RedactPiiAudioQuality.md)> | Controls the filetype of the audio created by redact_pii_audio. Currently supports mp3 (default) and wav. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details. | [optional][default to Mp3]
**redact_pii_policies** | Option<[**Vec<models::PiiPolicy>**](PiiPolicy.md)> | The list of PII Redaction policies to enable. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details. | [optional]
**redact_pii_sub** | Option<[**models::SubstitutionPolicy**](SubstitutionPolicy.md)> |  | [optional]
**redact_pii_audio_options** | Option<[**models::TranscriptOptionalParamsRedactPiiAudioOptions**](TranscriptOptionalParams_redact_pii_audio_options.md)> |  | [optional]
**speaker_labels** | Option<**bool**> | Enable [Speaker diarization](https://www.assemblyai.com/docs/models/speaker-diarization), can be true or false | [optional][default to false]
**speakers_expected** | Option<**i32**> | Tells the speaker label model how many speakers it should attempt to identify. See [Speaker diarization](https://www.assemblyai.com/docs/models/speaker-diarization) for more details. | [optional]
**speaker_options** | Option<[**models::TranscriptOptionalParamsSpeakerOptions**](TranscriptOptionalParams_speaker_options.md)> |  | [optional]
**content_safety** | Option<**bool**> | Enable [Content Moderation](https://www.assemblyai.com/docs/models/content-moderation), can be true or false | [optional][default to false]
**content_safety_confidence** | Option<**i32**> | The confidence threshold for the Content Moderation model. Values must be between 25 and 100. | [optional][default to 50]
**iab_categories** | Option<**bool**> | Enable [Topic Detection](https://www.assemblyai.com/docs/models/topic-detection), can be true or false | [optional][default to false]
**custom_spelling** | Option<[**Vec<models::TranscriptCustomSpelling>**](TranscriptCustomSpelling.md)> | Customize how words are spelled and formatted using to and from values | [optional]
**keyterms_prompt** | Option<**Vec<String>**> | Improve accuracy with up to 200 (for Universal) or 1000 (for Slam-1) domain-specific words or phrases (maximum 6 words per phrase).  | [optional]
**prompt** | Option<**String**> | This parameter does not currently have any functionality attached to it. | [optional]
**sentiment_analysis** | Option<**bool**> | Enable [Sentiment Analysis](https://www.assemblyai.com/docs/models/sentiment-analysis), can be true or false | [optional][default to false]
**auto_chapters** | Option<**bool**> | Enable [Auto Chapters](https://www.assemblyai.com/docs/models/auto-chapters), can be true or false | [optional][default to false]
**entity_detection** | Option<**bool**> | Enable [Entity Detection](https://www.assemblyai.com/docs/models/entity-detection), can be true or false | [optional][default to false]
**speech_threshold** | Option<**f32**> | Reject audio files that contain less than this fraction of speech. Valid values are in the range [0, 1] inclusive.  | [optional][default to 0]
**summarization** | Option<**bool**> | Enable [Summarization](https://www.assemblyai.com/docs/models/summarization), can be true or false | [optional][default to false]
**summary_model** | Option<[**models::SummaryModel**](SummaryModel.md)> | The model to summarize the transcript | [optional][default to Informative]
**summary_type** | Option<[**models::SummaryType**](SummaryType.md)> | The type of summary | [optional][default to Bullets]
**custom_topics** | Option<**bool**> | Enable custom topics, either true or false | [optional][default to false]
**topics** | Option<**Vec<String>**> | The list of custom topics | [optional]
**speech_understanding** | Option<[**models::TranscriptOptionalParamsSpeechUnderstanding**](TranscriptOptionalParams_speech_understanding.md)> |  | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



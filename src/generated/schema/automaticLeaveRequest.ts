/**
 * Generated by orval v7.9.0 🍺
 * Do not edit manually.
 * Meeting BaaS API
 * Meeting BaaS API
 * OpenAPI spec version: 1.1
 */
import type { AutomaticLeaveRequestNooneJoinedTimeout } from "./automaticLeaveRequestNooneJoinedTimeout"
import type { AutomaticLeaveRequestWaitingRoomTimeout } from "./automaticLeaveRequestWaitingRoomTimeout"

export interface AutomaticLeaveRequest {
  /**
   * The timeout in seconds for the bot to wait for participants to join before leaving the meeting, defaults to 600 seconds
   * @minimum 0
   */
  noone_joined_timeout?: AutomaticLeaveRequestNooneJoinedTimeout
  /**
   * The timeout in seconds for the bot to wait in the waiting room before leaving the meeting, defaults to 600 seconds
   * @minimum 0
   */
  waiting_room_timeout?: AutomaticLeaveRequestWaitingRoomTimeout
}

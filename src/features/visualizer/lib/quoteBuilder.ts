import { Shade, Room } from "../../../types";

export interface RoomShadeSummary {
  room: Room;
  shades: Shade[];
}

export function formatRoomShadeSummary(usedRooms: RoomShadeSummary[]): string {
  return usedRooms.map(({ room, shades }) => {
    const shadeText = shades.map(shade => `${shade.name} (JSW ${shade.jswCode})`).join(", ");
    return `- ${room.name}: ${shadeText}`;
  }).join("\n");
}

export function buildProjectQuoteMessage(usedRooms: RoomShadeSummary[], totalPhotos: number, allUsedShadesCount: number): string {
  const roomSummary = formatRoomShadeSummary(usedRooms);
  
  if (usedRooms.length > 0) {
    return `In-shop colour preview - Vishnu Paints\n\nRooms:\n${roomSummary}\n\nTotal photos: ${totalPhotos}\nSelected shades: ${allUsedShadesCount}\nNext step: prepare estimate and confirm paint availability.`;
  }
  
  return "";
}

export function buildSelectedShadeMessage(shade: Shade): string {
  return `In-shop colour preview - Vishnu Paints\n\nSelected shade: ${shade.name} (JSW ${shade.jswCode})\nNext step: help customer compare this shade on a room photo.`;
}

export function buildConsultationMessage(params: {
  customerName: string;
  roomType: string;
  shade: Shade;
  notes?: string;
  calculatorSummary?: string;
}): string {
  const { shade, roomType, notes, calculatorSummary, customerName } = params;
  
  return `Hello! Here is your JSW Paints colour suggestion from Vishnu Paints, Darsi:
Customer: ${customerName}
Shade: ${shade.name} (JSW Code: ${shade.jswCode}) | Colour: ${shade.code}
Room: ${roomType}
Notes: ${notes || 'None'}
${calculatorSummary ? `\nEstimate:\n${calculatorSummary}` : ''}

Visit us: Main Road, Darsi | Call: +91-9440052968`;
}

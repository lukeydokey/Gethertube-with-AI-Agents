jest.mock("@/services/room.service", () => ({
  roomService: {
    getRoom: jest.fn(),
    joinRoom: jest.fn(),
  },
}));

jest.mock("@/components/layout/MainLayout", () => ({
  __esModule: true,
  MainLayout: ({ children }: { children: React.ReactNode }) => {
    const React = require("react");
    return React.createElement("div", null, children);
  },
}));

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RoomJoinPage } from "./RoomJoinPage";
import { roomService } from "@/services/room.service";
import type { RoomResponse } from "@/types/room.types";

const mockedRoomService = roomService as jest.Mocked<typeof roomService>;

const publicRoom: RoomResponse = {
  id: "room-1",
  name: "공개 방",
  description: "같이 영상 보러 오세요.",
  isPublic: true,
  maxMembers: 10,
  memberCount: 3,
  host: {
    id: "host-1",
    name: "호스트",
    profileImage: null,
  },
  videoState: null,
  createdAt: "2026-03-18T00:00:00.000Z",
  updatedAt: "2026-03-18T00:00:00.000Z",
};

function renderPage(initialEntry = "/rooms/room-1/join") {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/rooms/:roomId/join" element={<RoomJoinPage />} />
        <Route path="/rooms/:roomId" element={<div>room runtime</div>} />
        <Route path="/rooms" element={<div>room list</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RoomJoinPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads room details and joins a public room", async () => {
    mockedRoomService.getRoom.mockResolvedValue(publicRoom);
    mockedRoomService.joinRoom.mockResolvedValue(undefined);

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "공개 방" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "방 참가하기" }));

    await waitFor(() => {
      expect(mockedRoomService.joinRoom).toHaveBeenCalledWith("room-1", undefined);
      expect(screen.getByText("room runtime")).toBeInTheDocument();
    });
  });

  it("accepts a password for private rooms and shows inline errors", async () => {
    mockedRoomService.getRoom.mockResolvedValue({
      ...publicRoom,
      isPublic: false,
      name: "비공개 방",
    });
    mockedRoomService.joinRoom.mockRejectedValueOnce(new Error("Invalid room password"));

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "비공개 방" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "wrong-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 확인 후 참가" }));

    await waitFor(() => {
      expect(mockedRoomService.joinRoom).toHaveBeenCalledWith("room-1", {
        password: "wrong-pass",
      });
    });

    expect(
      await screen.findByText("비밀번호가 올바르지 않습니다. 다시 입력해주세요."),
    ).toBeInTheDocument();
  });

  it("shows an invalid-link state when room lookup fails", async () => {
    mockedRoomService.getRoom.mockRejectedValue(new Error("Room not found"));

    renderPage();

    expect(
      await screen.findByText("초대 링크가 유효하지 않거나 방이 더 이상 존재하지 않습니다."),
    ).toBeInTheDocument();
  });

  it("shows a full-room state when join is rejected", async () => {
    mockedRoomService.getRoom.mockResolvedValue(publicRoom);
    mockedRoomService.joinRoom.mockRejectedValue(new Error("Room is full"));

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "공개 방" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "방 참가하기" }));

    expect(
      await screen.findByText("현재 방 인원이 가득 차 있어 참가할 수 없습니다."),
    ).toBeInTheDocument();
  });
});

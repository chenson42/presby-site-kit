import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaffList } from "../../src/components/StaffList";

describe("StaffList", () => {
  it("renders name, title, and optional contact fields when set", () => {
    render(
      <StaffList
        people={[
          {
            name: "Alex Rivera",
            title: "Pastor",
            phone: "555-0101",
            email: "pastor@example.invalid",
            photoUrl: "https://cdn.example.invalid/alex.jpg",
          },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Alex Rivera" })).toBeTruthy();
    expect(screen.getByText("Pastor")).toBeTruthy();
    expect(screen.getByRole("link", { name: "555-0101" }).getAttribute("href")).toBe(
      "tel:555-0101",
    );
    expect(screen.getByRole("link", { name: "pastor@example.invalid" }).getAttribute("href")).toBe(
      "mailto:pastor@example.invalid",
    );
    expect((screen.getByRole("img") as HTMLImageElement).alt).toBe("Alex Rivera");
  });

  it("omits phone, email, and photo when unset, without omitting the person", () => {
    const { container } = render(
      <StaffList people={[{ name: "Jordan Lee", title: "Office Administrator" }]} />,
    );
    expect(screen.getByText("Jordan Lee")).toBeTruthy();
    expect(container.querySelectorAll("a").length).toBe(0);
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders nothing for an empty roster", () => {
    const { container } = render(<StaffList people={[]} />);
    expect(container.innerHTML).toBe("");
  });
});

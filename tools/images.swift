// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Axolotl Commander Authors
//
// Images that need drawing rather than resizing (macOS only; run by tools/make-assets.sh):
//
//   swift tools/images.swift ico <icon.png> <favicon.ico>
//   swift tools/images.swift og <lang> <icon.png> <screenshot.png> <out.png>
//
// The social preview (Open Graph, 1200 × 630) repeats the page: two panes like the app icon,
// the icon, name and claim on the left, the app window on the right, cut by the edge.

import AppKit
import CoreText
import Foundation
import ImageIO
import UniformTypeIdentifiers

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data((message + "\n").utf8))
    exit(1)
}

func loadImage(_ path: String) -> CGImage {
    guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else { fail("Cannot read \(path)") }
    return image
}

func context(_ width: Int, _ height: Int) -> CGContext {
    guard let ctx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0,
                              space: CGColorSpace(name: CGColorSpace.sRGB)!,
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { fail("No context") }
    ctx.interpolationQuality = .high
    return ctx
}

func scaled(_ image: CGImage, _ size: Int) -> CGImage {
    let ctx = context(size, size)
    ctx.draw(image, in: CGRect(x: 0, y: 0, width: size, height: size))
    return ctx.makeImage()!
}

func write(_ images: [CGImage], _ type: UTType, _ path: String) {
    guard let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL,
                                                            type.identifier as CFString, images.count, nil)
    else { fail("Cannot write \(path)") }
    for image in images { CGImageDestinationAddImage(destination, image, nil) }
    guard CGImageDestinationFinalize(destination) else { fail("Cannot write \(path)") }
}

func rgb(_ hex: UInt32, _ alpha: CGFloat = 1) -> CGColor {
    CGColor(srgbRed: CGFloat(hex >> 16 & 0xFF) / 255, green: CGFloat(hex >> 8 & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255, alpha: alpha)
}

/// Draws `text` wrapped into `rect` (bottom-left origin) and returns the height it took.
@discardableResult
func draw(_ text: String, font: NSFont, color: CGColor, in rect: CGRect, lineHeight: CGFloat, ctx: CGContext) -> CGFloat {
    let style = NSMutableParagraphStyle()
    style.minimumLineHeight = lineHeight
    style.maximumLineHeight = lineHeight
    let string = NSAttributedString(string: text, attributes: [
        .font: font, .foregroundColor: NSColor(cgColor: color)!, .paragraphStyle: style,
    ])
    let framesetter = CTFramesetterCreateWithAttributedString(string)
    let fit = CTFramesetterSuggestFrameSizeWithConstraints(framesetter, CFRange(), nil, rect.size, nil)
    let frame = CTFramesetterCreateFrame(framesetter, CFRange(), CGPath(rect: rect, transform: nil), nil)
    CTFrameDraw(frame, ctx)
    return ceil(fit.height)
}

func socialImage(lang: String, iconPath: String, screenshotPath: String, out: String) {
    let contentURL = URL(fileURLWithPath: "content/\(lang).json")
    guard let data = try? Data(contentsOf: contentURL),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let claim = json["claim"] as? String else { fail("Cannot read the claim from \(contentURL.path)") }

    let width = 1200, height = 630
    let W = CGFloat(width), H = CGFloat(height)
    let split: CGFloat = 640
    let ctx = context(width, height)

    // Panes with the hero's vertical gradients, divided by a 2 px line.
    let panes: [(CGRect, UInt32, UInt32)] = [
        (CGRect(x: 0, y: 0, width: split, height: H), 0x1C5868, 0x102E3E),
        (CGRect(x: split, y: 0, width: W - split, height: H), 0x164858, 0x0C2432),
    ]
    for (rect, top, bottom) in panes {
        let gradient = CGGradient(colorsSpace: nil, colors: [rgb(top), rgb(bottom), rgb(bottom)] as CFArray,
                                  locations: [0, 0.75, 1])!
        ctx.saveGState()
        ctx.clip(to: rect)
        ctx.drawLinearGradient(gradient, start: CGPoint(x: 0, y: H), end: CGPoint(x: 0, y: 0), options: [])
        ctx.restoreGState()
    }
    ctx.setFillColor(rgb(0x081B25))
    ctx.fill(CGRect(x: split - 1, y: 0, width: 2, height: H))

    // The app window (the screenshot carries its own shadow), cut by the right and bottom edges.
    let shot = loadImage(screenshotPath)
    let shotHeight: CGFloat = 540
    let shotWidth = shotHeight * CGFloat(shot.width) / CGFloat(shot.height)
    ctx.draw(shot, in: CGRect(x: split + 8, y: H - 64 - shotHeight, width: shotWidth, height: shotHeight))

    // Icon, name, claim and address on the left pane.
    let left: CGFloat = 64
    let column = split - left - 56
    let icon = loadImage(iconPath)
    let iconSize: CGFloat = 168
    // The icon has a transparent margin of about 10 %; pull it left so the tile lines up.
    ctx.draw(icon, in: CGRect(x: left - iconSize * 0.098, y: H - 64 - iconSize, width: iconSize, height: iconSize))

    var top = H - 64 - iconSize - 18
    let titleFont = NSFont.systemFont(ofSize: 58, weight: .bold)
    top -= draw("Axolotl Commander", font: titleFont, color: rgb(0xEAF2F3),
                in: CGRect(x: left, y: 0, width: column + 40, height: top), lineHeight: 64, ctx: ctx)
    top -= 18
    draw(claim, font: NSFont.systemFont(ofSize: 30, weight: .medium), color: rgb(0xEAF2F3),
         in: CGRect(x: left, y: 0, width: column, height: top), lineHeight: 38, ctx: ctx)

    draw("axolotlcommander.org", font: NSFont.monospacedSystemFont(ofSize: 22, weight: .semibold),
         color: rgb(0xF696AC), in: CGRect(x: left, y: 48, width: column, height: 30), lineHeight: 28, ctx: ctx)

    write([ctx.makeImage()!], .png, out)
}

let args = CommandLine.arguments.dropFirst()
switch args.first {
case "ico" where args.count == 3:
    let icon = loadImage(args[args.startIndex + 1])
    write([16, 32, 48].map { scaled(icon, $0) }, UTType(filenameExtension: "ico")!, args[args.startIndex + 2])
case "og" where args.count == 5:
    let a = Array(args)
    socialImage(lang: a[1], iconPath: a[2], screenshotPath: a[3], out: a[4])
default:
    fail("usage: images.swift ico <icon.png> <out.ico> | og <lang> <icon.png> <screenshot.png> <out.png>")
}

export {}

declare global {
  interface DocumentPictureInPicture {
    requestWindow(options?: { width?: number; height?: number }): Promise<Window>
  }

  interface Document {
    documentPictureInPicture?: DocumentPictureInPicture
    pictureInPictureEnabled?: boolean
  }
}


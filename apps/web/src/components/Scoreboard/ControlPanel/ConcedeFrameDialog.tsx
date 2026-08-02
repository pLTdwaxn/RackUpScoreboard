import { AlertDialog, Button } from "@heroui/react";
import { useAppDictionary } from "@/i18n/client";

type ConcedeFrameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

const ConcedeFrameDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: ConcedeFrameDialogProps) => {
  const copy = useAppDictionary().controlPanel.concedeFrame;
  const commonCopy = useAppDictionary().common;

  return (
    <AlertDialog isOpen={open} onOpenChange={onOpenChange}>
      <AlertDialog.Backdrop variant="opaque">
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>{copy.heading}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>{copy.body}</AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="secondary" onPress={() => onOpenChange(false)}>
                {commonCopy.cancel}
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
              >
                {copy.concede}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
};

export default ConcedeFrameDialog;
